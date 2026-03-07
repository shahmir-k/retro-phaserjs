#include "engine.h"

void register_window_shim(JSCContext *ctx) {
    JSCValue *global = jsc_context_get_global_object(ctx);

    // window === globalThis
    jsc_value_object_set_property(global, "window", global);
    jsc_value_object_set_property(global, "self", global);
    jsc_value_object_set_property(global, "globalThis", global);

    // Window dimensions
    JSCValue *w = jsc_value_new_number(ctx, g_engine.screen_w);
    JSCValue *h = jsc_value_new_number(ctx, g_engine.screen_h);
    jsc_value_object_set_property(global, "innerWidth", w);
    jsc_value_object_set_property(global, "innerHeight", h);
    jsc_value_object_set_property(global, "outerWidth", w);
    jsc_value_object_set_property(global, "outerHeight", h);
    g_object_unref(w);
    g_object_unref(h);

    JSCValue *dpr = jsc_value_new_number(ctx, 1.0);
    jsc_value_object_set_property(global, "devicePixelRatio", dpr);
    g_object_unref(dpr);

    // navigator
    JSCValue *nav = jsc_value_new_object(ctx, NULL, NULL);
    JSCValue *ua = jsc_value_new_string(ctx, "TinyPhaser/1.0 (Linux; SDL2)");
    JSCValue *lang = jsc_value_new_string(ctx, "en");
    JSCValue *plat = jsc_value_new_string(ctx, "Linux");
    JSCValue *gc_val = jsc_value_new_number(ctx, 4);
    jsc_value_object_set_property(nav, "userAgent", ua);
    jsc_value_object_set_property(nav, "language", lang);
    jsc_value_object_set_property(nav, "platform", plat);
    jsc_value_object_set_property(nav, "hardwareConcurrency", gc_val);
    jsc_value_object_set_property(nav, "maxTouchPoints", jsc_value_new_number(ctx, 1));
    jsc_value_object_set_property(nav, "appVersion", jsc_value_new_string(ctx, "5.0 (Linux; SDL2) TinyPhaser/1.0"));
    jsc_value_object_set_property(nav, "standalone", jsc_value_new_boolean(ctx, FALSE));
    jsc_value_object_set_property(nav, "pointerEnabled", jsc_value_new_boolean(ctx, TRUE));
    jsc_value_object_set_property(nav, "msPointerEnabled", jsc_value_new_boolean(ctx, FALSE));
    jsc_context_set_value(ctx, "navigator", nav);
    g_object_unref(ua);
    g_object_unref(lang);
    g_object_unref(plat);
    g_object_unref(gc_val);
    g_object_unref(nav);

    // location
    JSCValue *loc = jsc_value_new_object(ctx, NULL, NULL);
    JSCValue *href = jsc_value_new_string(ctx, "file:///game/");
    JSCValue *proto = jsc_value_new_string(ctx, "file:");
    JSCValue *host = jsc_value_new_string(ctx, "");
    jsc_value_object_set_property(loc, "href", href);
    jsc_value_object_set_property(loc, "protocol", proto);
    jsc_value_object_set_property(loc, "hostname", host);
    jsc_value_object_set_property(loc, "host", host);
    jsc_value_object_set_property(loc, "pathname", jsc_value_new_string(ctx, "/game/"));
    jsc_value_object_set_property(loc, "search", jsc_value_new_string(ctx, ""));
    jsc_value_object_set_property(loc, "hash", jsc_value_new_string(ctx, ""));
    jsc_context_set_value(ctx, "location", loc);
    g_object_unref(href);
    g_object_unref(proto);
    g_object_unref(host);
    g_object_unref(loc);

    // screen
    JSCValue *screen = jsc_value_new_object(ctx, NULL, NULL);
    jsc_value_object_set_property(screen, "width", jsc_value_new_number(ctx, g_engine.screen_w));
    jsc_value_object_set_property(screen, "height", jsc_value_new_number(ctx, g_engine.screen_h));
    jsc_value_object_set_property(screen, "availWidth", jsc_value_new_number(ctx, g_engine.screen_w));
    jsc_value_object_set_property(screen, "availHeight", jsc_value_new_number(ctx, g_engine.screen_h));
    jsc_context_set_value(ctx, "screen", screen);
    g_object_unref(screen);

    // No-op functions that browsers have
    jsc_context_evaluate(ctx,
        "window.focus = function(){};"
        "window.blur = function(){};"
        "window.scrollTo = function(){};"
        "window.scrollX = 0; window.scrollY = 0;"
        "window.pageXOffset = 0; window.pageYOffset = 0;"
        "window.getComputedStyle = function(el){ return el && el.style ? el.style : {}; };"
        "window.matchMedia = function(q){"
        "  var m = { matches: false, media: q, addListener: function(){}, removeListener: function(){},"
        "    addEventListener: function(){}, removeEventListener: function(){} };"
        "  if (q.indexOf('orientation') >= 0 && q.indexOf('landscape') >= 0) m.matches = true;"
        "  return m;"
        "};"
        "window.addEventListener = window.addEventListener || function(){};"
        "window.removeEventListener = window.removeEventListener || function(){};"
        "window.orientation = 0;"
        "window.onblur = null;"
        "window.onfocus = null;"
        "window.onresize = null;"
        , -1);
}
