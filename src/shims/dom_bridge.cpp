// dom_bridge.cpp - Bridge between JSC DOM API and litehtml
// Provides a real DOM tree with CSS selector matching for Angular/React/Vue apps

#include "dom_bridge.h"
#include "engine.h"

#include <litehtml.h>
#include <map>
#include <vector>
#include <string>
#include <cstring>

// C++ needs explicit cast from gpointer to JSCValue*
#define JSC_ARG(args, i) ((JSCValue*)g_ptr_array_index(args, i))

using namespace litehtml;

// ---------------------------------------------------------------------------
// Element ID tracking
// ---------------------------------------------------------------------------
static int g_next_el_id = 1;
static std::map<int, element::ptr> g_elements;
static std::map<element*, int> g_element_ids;
static document::ptr g_doc;

static int register_element(element::ptr el) {
    if (!el) return 0;
    auto it = g_element_ids.find(el.get());
    if (it != g_element_ids.end()) return it->second;
    int id = g_next_el_id++;
    g_elements[id] = el;
    g_element_ids[el.get()] = id;
    return id;
}

static element::ptr get_element(int id) {
    auto it = g_elements.find(id);
    return (it != g_elements.end()) ? it->second : nullptr;
}

// Register all elements in a subtree recursively
static void register_tree(element::ptr el) {
    if (!el) return;
    register_element(el);
    for (auto& child : el->children()) {
        register_tree(child);
    }
}

// ---------------------------------------------------------------------------
// TinyPhaserContainer - litehtml::document_container implementation
// Phase 1: Minimal - just enough for DOM operations, no visual rendering
// ---------------------------------------------------------------------------
class TinyPhaserContainer : public document_container {
public:
    std::string base_url;

    uint_ptr create_font(const font_description& descr, const document* doc, font_metrics* fm) override {
        if (fm) {
            float sz = descr.size > 0 ? descr.size : 16.0f;
            fm->font_size = sz;
            fm->height = sz * 1.2f;
            fm->ascent = sz * 0.8f;
            fm->descent = sz * 0.2f;
            fm->x_height = sz * 0.5f;
            fm->ch_width = sz * 0.6f;
            fm->draw_spaces = true;
            fm->sub_shift = sz * 0.3f;
            fm->super_shift = sz * 0.4f;
        }
        return 1; // dummy handle
    }

    void delete_font(uint_ptr hFont) override {}

    pixel_t text_width(const char* text, uint_ptr hFont) override {
        return (pixel_t)(strlen(text) * 8);
    }

    void draw_text(uint_ptr hdc, const char* text, uint_ptr hFont,
                   web_color color, const position& pos) override {}

    pixel_t pt_to_px(float pt) const override {
        return (pixel_t)(pt * 96.0f / 72.0f);
    }

    pixel_t get_default_font_size() const override { return 16; }
    const char* get_default_font_name() const override { return "sans-serif"; }

    void draw_list_marker(uint_ptr hdc, const list_marker& marker) override {}
    void load_image(const char* src, const char* baseurl, bool redraw_on_ready) override {}
    void get_image_size(const char* src, const char* baseurl, size& sz) override {
        sz.width = 0; sz.height = 0;
    }
    void draw_image(uint_ptr hdc, const background_layer& layer,
                    const std::string& url, const std::string& base_url) override {}
    void draw_solid_fill(uint_ptr hdc, const background_layer& layer,
                         const web_color& color) override {}
    void draw_linear_gradient(uint_ptr hdc, const background_layer& layer,
                              const background_layer::linear_gradient& gradient) override {}
    void draw_radial_gradient(uint_ptr hdc, const background_layer& layer,
                              const background_layer::radial_gradient& gradient) override {}
    void draw_conic_gradient(uint_ptr hdc, const background_layer& layer,
                             const background_layer::conic_gradient& gradient) override {}
    void draw_borders(uint_ptr hdc, const borders& borders,
                      const position& draw_pos, bool root) override {}

    void set_caption(const char* caption) override {
        if (g_engine.window) SDL_SetWindowTitle(g_engine.window, caption);
    }

    void set_base_url(const char* url) override {
        base_url = url ? url : "";
    }

    void link(const std::shared_ptr<litehtml::document>& doc, const element::ptr& el) override {}
    void on_anchor_click(const char* url, const element::ptr& el) override {}
    void on_mouse_event(const element::ptr& el, mouse_event event) override {}
    void set_cursor(const char* cursor) override {}

    void transform_text(litehtml::string& text, text_transform tt) override {
        if (tt == text_transform_capitalize && !text.empty()) {
            text[0] = toupper(text[0]);
        } else if (tt == text_transform_uppercase) {
            for (auto& c : text) c = toupper(c);
        } else if (tt == text_transform_lowercase) {
            for (auto& c : text) c = tolower(c);
        }
    }

    void import_css(litehtml::string& text, const litehtml::string& url,
                    litehtml::string& baseurl) override {
        // Try to load CSS from file relative to game dir
        if (g_engine.game_dir && !url.empty()) {
            char path[2048];
            snprintf(path, sizeof(path), "%s/%s", g_engine.game_dir, url.c_str());
            size_t len;
            char* data = engine_read_file(path, &len);
            if (data) {
                text = data;
                free(data);
            }
        }
    }

    void set_clip(const position& pos, const border_radiuses& bdr_radius) override {}
    void del_clip() override {}

    void get_viewport(position& viewport) const override {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = g_engine.screen_w;
        viewport.height = g_engine.screen_h;
    }

    element::ptr create_element(const char* tag_name, const string_map& attributes,
                                const std::shared_ptr<litehtml::document>& doc) override {
        return nullptr; // let litehtml create default elements
    }

    void get_media_features(media_features& media) const override {
        media.type = media_type_screen;
        media.width = g_engine.screen_w;
        media.height = g_engine.screen_h;
        media.device_width = g_engine.screen_w;
        media.device_height = g_engine.screen_h;
        media.color = 8;
        media.color_index = 256;
        media.monochrome = 0;
        media.resolution = 96;
    }

    void get_language(litehtml::string& language, litehtml::string& culture) const override {
        language = "en";
        culture = "";
    }
};

static TinyPhaserContainer* g_container = nullptr;

// ---------------------------------------------------------------------------
// Native JSC functions
// ---------------------------------------------------------------------------

// __domCreateElement(tag) → element_id
static JSCValue* native_dom_create_element(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (!g_doc || args->len < 1) return jsc_value_new_number(ctx, 0);

    char* tag = jsc_value_to_string(JSC_ARG(args, 0));
    string_map attrs;
    auto el = g_doc->create_element(tag, attrs);
    g_free(tag);

    if (!el) return jsc_value_new_number(ctx, 0);
    return jsc_value_new_number(ctx, register_element(el));
}

// __domCreateTextNode(text) → element_id
static JSCValue* native_dom_create_text_node(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (!g_doc || args->len < 1) return jsc_value_new_number(ctx, 0);

    char* text = jsc_value_to_string(JSC_ARG(args, 0));
    string_map attrs;
    auto el = g_doc->create_element("", attrs);
    if (el) {
        el->set_data(text);
    }
    g_free(text);

    if (!el) return jsc_value_new_number(ctx, 0);
    return jsc_value_new_number(ctx, register_element(el));
}

// __domAppendChild(parentId, childId) → success
static JSCValue* native_dom_append_child(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_boolean(ctx, FALSE);

    int parent_id = jsc_value_to_int32(JSC_ARG(args, 0));
    int child_id = jsc_value_to_int32(JSC_ARG(args, 1));

    auto parent = get_element(parent_id);
    auto child = get_element(child_id);
    if (!parent || !child) return jsc_value_new_boolean(ctx, FALSE);

    // Remove from old parent first
    auto old_parent = child->parent();
    if (old_parent) {
        old_parent->removeChild(child);
    }

    bool ok = parent->appendChild(child);
    return jsc_value_new_boolean(ctx, ok);
}

// __domRemoveChild(parentId, childId) → success
static JSCValue* native_dom_remove_child(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_boolean(ctx, FALSE);

    int parent_id = jsc_value_to_int32(JSC_ARG(args, 0));
    int child_id = jsc_value_to_int32(JSC_ARG(args, 1));

    auto parent = get_element(parent_id);
    auto child = get_element(child_id);
    if (!parent || !child) return jsc_value_new_boolean(ctx, FALSE);

    bool ok = parent->removeChild(child);
    return jsc_value_new_boolean(ctx, ok);
}

// __domInsertBefore(parentId, newChildId, refChildId) → success
static JSCValue* native_dom_insert_before(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 3) return jsc_value_new_boolean(ctx, FALSE);

    int parent_id = jsc_value_to_int32(JSC_ARG(args, 0));
    int new_id = jsc_value_to_int32(JSC_ARG(args, 1));
    int ref_id = jsc_value_to_int32(JSC_ARG(args, 2));

    auto parent = get_element(parent_id);
    auto new_child = get_element(new_id);
    if (!parent || !new_child) return jsc_value_new_boolean(ctx, FALSE);

    // Remove from old parent
    auto old_parent = new_child->parent();
    if (old_parent) {
        old_parent->removeChild(new_child);
    }

    if (ref_id == 0) {
        // No ref child = append
        return jsc_value_new_boolean(ctx, parent->appendChild(new_child));
    }

    auto ref_child = get_element(ref_id);
    if (!ref_child) {
        return jsc_value_new_boolean(ctx, parent->appendChild(new_child));
    }

    // Find ref_child position and insert before it
    // litehtml doesn't have insertBefore, so we manipulate the children list
    // We need to remove all children after ref, add new_child, then re-add them
    auto& children = parent->children();
    std::vector<element::ptr> after;
    bool found = false;
    for (auto it = children.begin(); it != children.end(); ) {
        if (found) {
            after.push_back(*it);
            it = const_cast<std::list<element::ptr>&>(children).erase(it);
        } else if (it->get() == ref_child.get()) {
            found = true;
            after.push_back(*it);
            it = const_cast<std::list<element::ptr>&>(children).erase(it);
        } else {
            ++it;
        }
    }

    parent->appendChild(new_child);
    for (auto& el : after) {
        parent->appendChild(el);
    }

    return jsc_value_new_boolean(ctx, TRUE);
}

// __domQuerySelector(contextId, selector) → element_id or 0
static JSCValue* native_dom_query_selector(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_number(ctx, 0);

    int context_id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* selector = jsc_value_to_string(JSC_ARG(args, 1));

    element::ptr context_el;
    if (context_id == 0 && g_doc) {
        context_el = g_doc->root();
    } else {
        context_el = get_element(context_id);
    }

    int result_id = 0;
    if (context_el) {
        auto found = context_el->select_one(selector);
        if (found) {
            result_id = register_element(found);
        }
    }

    g_free(selector);
    return jsc_value_new_number(ctx, result_id);
}

// __domQuerySelectorAll(contextId, selector) → [element_ids]
static JSCValue* native_dom_query_selector_all(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_array(ctx, G_TYPE_NONE);

    int context_id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* selector = jsc_value_to_string(JSC_ARG(args, 1));

    element::ptr context_el;
    if (context_id == 0 && g_doc) {
        context_el = g_doc->root();
    } else {
        context_el = get_element(context_id);
    }

    // Build result array via JS
    JSCValue* arr = jsc_context_evaluate(ctx, "[]", -1);

    if (context_el) {
        auto results = context_el->select_all(std::string(selector));
        for (auto& el : results) {
            int id = register_element(el);
            JSCValue* id_val = jsc_value_new_number(ctx, id);
            jsc_value_object_invoke_method(arr, "push", JSC_TYPE_VALUE, id_val, G_TYPE_NONE);
            g_object_unref(id_val);
        }
    }

    g_free(selector);
    return arr;
}

// __domGetAttr(id, name) → string or null
static JSCValue* native_dom_get_attr(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_null(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* name = jsc_value_to_string(JSC_ARG(args, 1));

    auto el = get_element(id);
    JSCValue* result;
    if (el) {
        const char* val = el->get_attr(name);
        result = val ? jsc_value_new_string(ctx, val) : jsc_value_new_null(ctx);
    } else {
        result = jsc_value_new_null(ctx);
    }

    g_free(name);
    return result;
}

// __domSetAttr(id, name, value)
static JSCValue* native_dom_set_attr(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 3) return jsc_value_new_undefined(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* name = jsc_value_to_string(JSC_ARG(args, 1));
    char* value = jsc_value_to_string(JSC_ARG(args, 2));

    auto el = get_element(id);
    if (el) {
        el->set_attr(name, value);
    }

    g_free(name);
    g_free(value);
    return jsc_value_new_undefined(ctx);
}

// __domRemoveAttr(id, name)
static JSCValue* native_dom_remove_attr(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_undefined(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* name = jsc_value_to_string(JSC_ARG(args, 1));

    auto el = get_element(id);
    if (el) {
        el->set_attr(name, nullptr);
    }

    g_free(name);
    return jsc_value_new_undefined(ctx);
}

// __domGetTagName(id) → string
static JSCValue* native_dom_get_tag_name(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_string(ctx, "");

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    if (el) {
        const char* tag = el->get_tagName();
        return jsc_value_new_string(ctx, tag ? tag : "");
    }
    return jsc_value_new_string(ctx, "");
}

// __domGetParentId(id) → parent_id or 0
static JSCValue* native_dom_get_parent_id(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_number(ctx, 0);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    if (el) {
        auto parent = el->parent();
        if (parent) {
            return jsc_value_new_number(ctx, register_element(parent));
        }
    }
    return jsc_value_new_number(ctx, 0);
}

// __domGetChildIds(id) → [child_ids]
static JSCValue* native_dom_get_child_ids(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_array(ctx, G_TYPE_NONE);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    JSCValue* arr = jsc_context_evaluate(ctx, "[]", -1);
    if (el) {
        for (auto& child : el->children()) {
            int cid = register_element(child);
            JSCValue* v = jsc_value_new_number(ctx, cid);
            jsc_value_object_invoke_method(arr, "push", JSC_TYPE_VALUE, v, G_TYPE_NONE);
            g_object_unref(v);
        }
    }
    return arr;
}

// __domGetText(id) → string
static JSCValue* native_dom_get_text(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_string(ctx, "");

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    if (el) {
        litehtml::string text;
        el->get_text(text);
        return jsc_value_new_string(ctx, text.c_str());
    }
    return jsc_value_new_string(ctx, "");
}

// __domSetText(id, text)
static JSCValue* native_dom_set_text(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 2) return jsc_value_new_undefined(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* text = jsc_value_to_string(JSC_ARG(args, 1));

    auto el = get_element(id);
    if (el) {
        el->set_data(text);
    }

    g_free(text);
    return jsc_value_new_undefined(ctx);
}

// __domSetInnerHTML(id, html)
static JSCValue* native_dom_set_inner_html(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (!g_doc || args->len < 2) return jsc_value_new_undefined(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* html = jsc_value_to_string(JSC_ARG(args, 1));

    auto el = get_element(id);
    if (el) {
        g_doc->append_children_from_string(*el, html, true);
        // Register new children
        for (auto& child : el->children()) {
            register_tree(child);
        }
    }

    g_free(html);
    return jsc_value_new_undefined(ctx);
}

// __domSetClass(id, className, add)
static JSCValue* native_dom_set_class(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 3) return jsc_value_new_undefined(ctx);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    char* cls = jsc_value_to_string(JSC_ARG(args, 1));
    bool add = jsc_value_to_boolean(JSC_ARG(args, 2));

    auto el = get_element(id);
    if (el) {
        el->set_class(cls, add);
    }

    g_free(cls);
    return jsc_value_new_undefined(ctx);
}

// __domIsText(id) → bool (check if element is a text node)
static JSCValue* native_dom_is_text(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_boolean(ctx, FALSE);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    return jsc_value_new_boolean(ctx, el && el->is_text());
}

// __domIsComment(id) → bool
static JSCValue* native_dom_is_comment(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_boolean(ctx, FALSE);

    int id = jsc_value_to_int32(JSC_ARG(args, 0));
    auto el = get_element(id);

    return jsc_value_new_boolean(ctx, el && el->is_comment());
}

// __domGetDocRootId() → id of <html> element
static JSCValue* native_dom_get_doc_root_id(GPtrArray* args, gpointer user_data) {
    JSCContext* ctx = jsc_context_get_current();
    if (!g_doc) return jsc_value_new_number(ctx, 0);

    auto root = g_doc->root();
    if (!root) return jsc_value_new_number(ctx, 0);

    // The root is typically the document node; find the <html> element
    for (auto& child : root->children()) {
        const char* tag = child->get_tagName();
        if (tag && strcasecmp(tag, "html") == 0) {
            return jsc_value_new_number(ctx, register_element(child));
        }
    }
    // Fallback: return root itself
    return jsc_value_new_number(ctx, register_element(root));
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

static void register_fn(JSCContext* ctx, const char* name, GCallback cb) {
    JSCValue* fn = jsc_value_new_function_variadic(ctx, name, cb, NULL, NULL, JSC_TYPE_VALUE);
    jsc_context_set_value(ctx, name, fn);
    g_object_unref(fn);
}

extern "C" void register_dom_bridge_shim(JSCContext* ctx) {
    register_fn(ctx, "__domCreateElement", G_CALLBACK(native_dom_create_element));
    register_fn(ctx, "__domCreateTextNode", G_CALLBACK(native_dom_create_text_node));
    register_fn(ctx, "__domAppendChild", G_CALLBACK(native_dom_append_child));
    register_fn(ctx, "__domRemoveChild", G_CALLBACK(native_dom_remove_child));
    register_fn(ctx, "__domInsertBefore", G_CALLBACK(native_dom_insert_before));
    register_fn(ctx, "__domQuerySelector", G_CALLBACK(native_dom_query_selector));
    register_fn(ctx, "__domQuerySelectorAll", G_CALLBACK(native_dom_query_selector_all));
    register_fn(ctx, "__domGetAttr", G_CALLBACK(native_dom_get_attr));
    register_fn(ctx, "__domSetAttr", G_CALLBACK(native_dom_set_attr));
    register_fn(ctx, "__domRemoveAttr", G_CALLBACK(native_dom_remove_attr));
    register_fn(ctx, "__domGetTagName", G_CALLBACK(native_dom_get_tag_name));
    register_fn(ctx, "__domGetParentId", G_CALLBACK(native_dom_get_parent_id));
    register_fn(ctx, "__domGetChildIds", G_CALLBACK(native_dom_get_child_ids));
    register_fn(ctx, "__domGetText", G_CALLBACK(native_dom_get_text));
    register_fn(ctx, "__domSetText", G_CALLBACK(native_dom_set_text));
    register_fn(ctx, "__domSetInnerHTML", G_CALLBACK(native_dom_set_inner_html));
    register_fn(ctx, "__domSetClass", G_CALLBACK(native_dom_set_class));
    register_fn(ctx, "__domIsText", G_CALLBACK(native_dom_is_text));
    register_fn(ctx, "__domIsComment", G_CALLBACK(native_dom_is_comment));
    register_fn(ctx, "__domGetDocRootId", G_CALLBACK(native_dom_get_doc_root_id));

    printf("[DOM] Bridge registered (%d native functions)\n", 20);
}

extern "C" void dom_bridge_load_html(JSCContext* ctx, const char* html) {
    if (!html) return;

    if (!g_container) {
        g_container = new TinyPhaserContainer();
    }

    // Parse HTML into litehtml document
    g_doc = document::createFromString(html, g_container);

    if (g_doc) {
        // Do initial layout so elements have positions
        g_doc->render(g_engine.screen_w);

        // Register all elements in the tree
        register_tree(g_doc->root());

        printf("[DOM] Parsed HTML document (%d elements registered)\n", g_next_el_id - 1);
    } else {
        fprintf(stderr, "[DOM] Failed to parse HTML\n");
    }
}

extern "C" void dom_bridge_shutdown(void) {
    g_elements.clear();
    g_element_ids.clear();
    g_doc.reset();
    delete g_container;
    g_container = nullptr;
    g_next_el_id = 1;
}
