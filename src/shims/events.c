#include "engine.h"

// SDL keycode to DOM key string
static const char *sdl_to_dom_key(SDL_Keycode key) {
    switch (key) {
        case SDLK_UP:     return "ArrowUp";
        case SDLK_DOWN:   return "ArrowDown";
        case SDLK_LEFT:   return "ArrowLeft";
        case SDLK_RIGHT:  return "ArrowRight";
        case SDLK_SPACE:  return " ";
        case SDLK_RETURN: return "Enter";
        case SDLK_ESCAPE: return "Escape";
        case SDLK_TAB:    return "Tab";
        case SDLK_BACKSPACE: return "Backspace";
        case SDLK_DELETE: return "Delete";
        case SDLK_LSHIFT: case SDLK_RSHIFT: return "Shift";
        case SDLK_LCTRL:  case SDLK_RCTRL:  return "Control";
        case SDLK_LALT:   case SDLK_RALT:   return "Alt";
        default:
            if (key >= SDLK_a && key <= SDLK_z) {
                static char buf[2];
                buf[0] = (char)key;
                buf[1] = '\0';
                return buf;
            }
            if (key >= SDLK_0 && key <= SDLK_9) {
                static char nbuf[2];
                nbuf[0] = (char)key;
                nbuf[1] = '\0';
                return nbuf;
            }
            return "Unidentified";
    }
}

static const char *sdl_to_dom_code(SDL_Scancode sc) {
    switch (sc) {
        case SDL_SCANCODE_UP:    return "ArrowUp";
        case SDL_SCANCODE_DOWN:  return "ArrowDown";
        case SDL_SCANCODE_LEFT:  return "ArrowLeft";
        case SDL_SCANCODE_RIGHT: return "ArrowRight";
        case SDL_SCANCODE_SPACE: return "Space";
        case SDL_SCANCODE_RETURN: return "Enter";
        case SDL_SCANCODE_ESCAPE: return "Escape";
        case SDL_SCANCODE_TAB:   return "Tab";
        case SDL_SCANCODE_LSHIFT: return "ShiftLeft";
        case SDL_SCANCODE_RSHIFT: return "ShiftRight";
        case SDL_SCANCODE_LCTRL:  return "ControlLeft";
        case SDL_SCANCODE_RCTRL:  return "ControlRight";
        default:
            if (sc >= SDL_SCANCODE_A && sc <= SDL_SCANCODE_Z) {
                static char buf[8];
                snprintf(buf, sizeof(buf), "Key%c", 'A' + (sc - SDL_SCANCODE_A));
                return buf;
            }
            if (sc >= SDL_SCANCODE_1 && sc <= SDL_SCANCODE_0) {
                static char nbuf[8];
                int digit = (sc == SDL_SCANCODE_0) ? 0 : (sc - SDL_SCANCODE_1 + 1);
                snprintf(nbuf, sizeof(nbuf), "Digit%d", digit);
                return nbuf;
            }
            return "";
    }
}

static int sdl_to_keycode(SDL_Keycode key) {
    // DOM keyCode values for common keys
    if (key >= SDLK_a && key <= SDLK_z) return key - SDLK_a + 65;
    if (key >= SDLK_0 && key <= SDLK_9) return key - SDLK_0 + 48;
    switch (key) {
        case SDLK_UP:     return 38;
        case SDLK_DOWN:   return 40;
        case SDLK_LEFT:   return 37;
        case SDLK_RIGHT:  return 39;
        case SDLK_SPACE:  return 32;
        case SDLK_RETURN: return 13;
        case SDLK_ESCAPE: return 27;
        case SDLK_TAB:    return 9;
        case SDLK_LSHIFT: case SDLK_RSHIFT: return 16;
        case SDLK_LCTRL:  case SDLK_RCTRL:  return 17;
        case SDLK_LALT:   case SDLK_RALT:   return 18;
        default: return 0;
    }
}

static void fire_key_event(const char *type, SDL_KeyboardEvent *key) {
    JSCContext *ctx = g_engine.js_ctx;

    const char *dom_key = sdl_to_dom_key(key->keysym.sym);
    const char *dom_code = sdl_to_dom_code(key->keysym.scancode);
    int keyCode = sdl_to_keycode(key->keysym.sym);

    char js[1024];
    snprintf(js, sizeof(js),
        "(function() {"
        "  var e = { type:'%s', key:'%s', code:'%s', keyCode:%d, which:%d,"
        "    ctrlKey:%s, shiftKey:%s, altKey:%s, metaKey:false,"
        "    repeat:%s, preventDefault:function(){}, stopPropagation:function(){} };"
        "  if (window._eventListeners && window._eventListeners['%s']) {"
        "    window._eventListeners['%s'].forEach(function(cb){ cb(e); });"
        "  }"
        "})();",
        type, dom_key, dom_code, keyCode, keyCode,
        (key->keysym.mod & KMOD_CTRL) ? "true" : "false",
        (key->keysym.mod & KMOD_SHIFT) ? "true" : "false",
        (key->keysym.mod & KMOD_ALT) ? "true" : "false",
        key->repeat ? "true" : "false",
        type, type);

    JSCValue *r = jsc_context_evaluate(ctx, js, -1);
    if (r) g_object_unref(r);
}

static void fire_mouse_event(const char *type, int x, int y, int button) {
    JSCContext *ctx = g_engine.js_ctx;

    char js[2048];
    snprintf(js, sizeof(js),
        "(function() {"
        "  var e = { type:'%s', clientX:%d, clientY:%d, pageX:%d, pageY:%d,"
        "    offsetX:%d, offsetY:%d, button:%d, buttons:%d,"
        "    pointerId:1, pointerType:'mouse', isPrimary:true,"
        "    preventDefault:function(){}, stopPropagation:function(){} };"
        "  if (typeof _primaryCanvas !== 'undefined' && _primaryCanvas && _primaryCanvas._listeners && _primaryCanvas._listeners['%s']) {"
        "    _primaryCanvas._listeners['%s'].slice().forEach(function(cb){ cb(e); });"
        "  }"
        "  if (typeof __canvas !== 'undefined' && __canvas._listeners && __canvas._listeners['%s']) {"
        "    __canvas._listeners['%s'].slice().forEach(function(cb){ cb(e); });"
        "  }"
        "  if (window._eventListeners && window._eventListeners['%s']) {"
        "    window._eventListeners['%s'].slice().forEach(function(cb){ cb(e); });"
        "  }"
        "})();",
        type, x, y, x, y, x, y, button, button ? 1 : 0,
        type, type, type, type, type, type);

    JSCValue *r = jsc_context_evaluate(ctx, js, -1);
    if (r) g_object_unref(r);
}

void translate_sdl_event(SDL_Event *event) {
    switch (event->type) {
        case SDL_KEYDOWN:
            fire_key_event("keydown", &event->key);
            break;
        case SDL_KEYUP:
            fire_key_event("keyup", &event->key);
            break;
        case SDL_MOUSEMOTION:
            fire_mouse_event("pointermove", event->motion.x, event->motion.y, 0);
            fire_mouse_event("mousemove", event->motion.x, event->motion.y, 0);
            break;
        case SDL_MOUSEBUTTONDOWN:
            fire_mouse_event("pointerdown", event->button.x, event->button.y, event->button.button - 1);
            fire_mouse_event("mousedown", event->button.x, event->button.y, event->button.button - 1);
            break;
        case SDL_MOUSEBUTTONUP:
            fire_mouse_event("pointerup", event->button.x, event->button.y, event->button.button - 1);
            fire_mouse_event("mouseup", event->button.x, event->button.y, event->button.button - 1);
            break;
        case SDL_WINDOWEVENT:
            if (event->window.event == SDL_WINDOWEVENT_RESIZED) {
                g_engine.screen_w = event->window.data1;
                g_engine.screen_h = event->window.data2;
            }
            break;
    }
}

void register_events_shim(JSCContext *ctx) {
    // Set up event listener registry on window
    jsc_context_evaluate(ctx,
        "window._eventListeners = {};"
        "window.addEventListener = function(type, cb) {"
        "  if (!window._eventListeners[type]) window._eventListeners[type] = [];"
        "  window._eventListeners[type].push(cb);"
        "};"
        "window.removeEventListener = function(type, cb) {"
        "  if (!window._eventListeners[type]) return;"
        "  var idx = window._eventListeners[type].indexOf(cb);"
        "  if (idx >= 0) window._eventListeners[type].splice(idx, 1);"
        "};"
        , -1);
}
