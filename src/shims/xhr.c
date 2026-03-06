#include "engine.h"
#include <string.h>

// XHR is implemented mostly in JS (polyfills.js) with a native file reader
static JSCValue *native_read_file_text(GPtrArray *args, gpointer user_data) {
    JSCContext *ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_null(ctx);

    char *url = jsc_value_to_string(g_ptr_array_index(args, 0));
    char *path = engine_resolve_path(url);
    g_free(url);

    size_t len;
    char *data = engine_read_file(path, &len);
    free(path);

    if (data) {
        JSCValue *result = jsc_value_new_string(ctx, data);
        free(data);
        return result;
    }
    return jsc_value_new_null(ctx);
}

static JSCValue *native_read_file_buffer(GPtrArray *args, gpointer user_data) {
    JSCContext *ctx = jsc_context_get_current();
    if (args->len < 1) return jsc_value_new_null(ctx);

    char *url = jsc_value_to_string(g_ptr_array_index(args, 0));
    char *path = engine_resolve_path(url);
    g_free(url);

    size_t len;
    char *data = engine_read_file(path, &len);
    free(path);

    if (data) {
        // Copy into GLib-allocated buffer for JSC array buffer
        void *copy = g_memdup2(data, len);
        free(data);
        JSCValue *result = jsc_value_new_array_buffer(ctx, copy, len, g_free, copy);
        return result;
    }
    return jsc_value_new_null(ctx);
}

void register_xhr_shim(JSCContext *ctx) {
    JSCValue *rf_text = jsc_value_new_function_variadic(ctx, "__readFileText",
        G_CALLBACK(native_read_file_text), NULL, NULL, JSC_TYPE_VALUE);
    JSCValue *rf_buf = jsc_value_new_function_variadic(ctx, "__readFileBuffer",
        G_CALLBACK(native_read_file_buffer), NULL, NULL, JSC_TYPE_VALUE);

    jsc_context_set_value(ctx, "__readFileText", rf_text);
    jsc_context_set_value(ctx, "__readFileBuffer", rf_buf);

    g_object_unref(rf_text);
    g_object_unref(rf_buf);
}
