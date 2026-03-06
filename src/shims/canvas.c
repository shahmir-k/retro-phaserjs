#include "engine.h"

static JSCValue *native_getContext(GPtrArray *args, gpointer user_data) {
    JSCContext *ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_null(ctx);

    char *type = jsc_value_to_string(g_ptr_array_index(args, 0));

    if (strcmp(type, "webgl") == 0 ||
        strcmp(type, "webgl2") == 0 ||
        strcmp(type, "experimental-webgl") == 0) {
        g_free(type);
        if (g_engine.webgl_ctx_obj) {
            g_object_ref(g_engine.webgl_ctx_obj);
            return g_engine.webgl_ctx_obj;
        }
        return jsc_value_new_null(ctx);
    }

    g_free(type);
    // TODO: Canvas2D context
    return jsc_value_new_null(ctx);
}

static JSCValue *native_getBoundingClientRect(GPtrArray *args, gpointer user_data) {
    JSCContext *ctx = jsc_context_get_current();
    JSCValue *rect = jsc_value_new_object(ctx, NULL, NULL);
    jsc_value_object_set_property(rect, "left", jsc_value_new_number(ctx, 0));
    jsc_value_object_set_property(rect, "top", jsc_value_new_number(ctx, 0));
    jsc_value_object_set_property(rect, "right", jsc_value_new_number(ctx, g_engine.screen_w));
    jsc_value_object_set_property(rect, "bottom", jsc_value_new_number(ctx, g_engine.screen_h));
    jsc_value_object_set_property(rect, "width", jsc_value_new_number(ctx, g_engine.screen_w));
    jsc_value_object_set_property(rect, "height", jsc_value_new_number(ctx, g_engine.screen_h));
    jsc_value_object_set_property(rect, "x", jsc_value_new_number(ctx, 0));
    jsc_value_object_set_property(rect, "y", jsc_value_new_number(ctx, 0));
    return rect;
}

void register_canvas_shim(JSCContext *ctx) {
    JSCValue *canvas = jsc_value_new_object(ctx, NULL, NULL);

    // Properties
    jsc_value_object_set_property(canvas, "width",
        jsc_value_new_number(ctx, g_engine.screen_w));
    jsc_value_object_set_property(canvas, "height",
        jsc_value_new_number(ctx, g_engine.screen_h));
    jsc_value_object_set_property(canvas, "tagName",
        jsc_value_new_string(ctx, "CANVAS"));
    jsc_value_object_set_property(canvas, "nodeName",
        jsc_value_new_string(ctx, "CANVAS"));

    // Style stub
    JSCValue *style = jsc_value_new_object(ctx, NULL, NULL);
    jsc_value_object_set_property(canvas, "style", style);
    g_object_unref(style);

    // parentElement / parentNode
    JSCValue *body_ref = jsc_context_get_value(ctx, "document");
    if (body_ref) {
        JSCValue *body = jsc_value_object_get_property(body_ref, "body");
        jsc_value_object_set_property(canvas, "parentElement", body);
        jsc_value_object_set_property(canvas, "parentNode", body);
        g_object_unref(body);
        g_object_unref(body_ref);
    }

    // Methods
    JSCValue *gc = jsc_value_new_function_variadic(ctx, "getContext",
        G_CALLBACK(native_getContext), NULL, NULL, JSC_TYPE_VALUE);
    JSCValue *gbcr = jsc_value_new_function_variadic(ctx, "getBoundingClientRect",
        G_CALLBACK(native_getBoundingClientRect), NULL, NULL, JSC_TYPE_VALUE);

    jsc_value_object_set_property(canvas, "getContext", gc);
    jsc_value_object_set_property(canvas, "getBoundingClientRect", gbcr);

    g_object_unref(gc);
    g_object_unref(gbcr);

    // Store globally
    g_engine.canvas_obj = canvas;
    g_object_ref(canvas);

    // Make accessible
    jsc_context_set_value(ctx, "__canvas", canvas);

    // Stub methods via JS
    jsc_context_evaluate(ctx,
        "__canvas.addEventListener = function(type, cb) {"
        "  if (!this._listeners) this._listeners = {};"
        "  if (!this._listeners[type]) this._listeners[type] = [];"
        "  this._listeners[type].push(cb);"
        "};"
        "__canvas.removeEventListener = function(type, cb) {"
        "  if (!this._listeners || !this._listeners[type]) return;"
        "  var idx = this._listeners[type].indexOf(cb);"
        "  if (idx >= 0) this._listeners[type].splice(idx, 1);"
        "};"
        "__canvas.setAttribute = function(){};"
        "__canvas.focus = function(){};"
        "__canvas.classList = { add: function(){}, remove: function(){} };"
        , -1);

    g_object_unref(canvas);
}
