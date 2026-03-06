#include "engine.h"
#include <stdio.h>

static void log_with_prefix(const char *prefix, GPtrArray *args) {
    if (prefix) fprintf(stdout, "%s ", prefix);
    for (guint i = 0; i < args->len; i++) {
        JSCValue *val = g_ptr_array_index(args, i);
        char *str = jsc_value_to_string(val);
        fprintf(stdout, "%s%s", str, (i < args->len - 1) ? " " : "");
        g_free(str);
    }
    fprintf(stdout, "\n");
    fflush(stdout);
}

static void native_console_log(GPtrArray *args, gpointer user_data) {
    log_with_prefix(NULL, args);
}

static void native_console_warn(GPtrArray *args, gpointer user_data) {
    log_with_prefix("[WARN]", args);
}

static void native_console_error(GPtrArray *args, gpointer user_data) {
    log_with_prefix("[ERROR]", args);
}

static void native_console_info(GPtrArray *args, gpointer user_data) {
    log_with_prefix("[INFO]", args);
}

void register_console_shim(JSCContext *ctx) {
    JSCValue *console = jsc_value_new_object(ctx, NULL, NULL);

    JSCValue *log = jsc_value_new_function_variadic(ctx, "log",
        G_CALLBACK(native_console_log), NULL, NULL, G_TYPE_NONE);
    JSCValue *warn = jsc_value_new_function_variadic(ctx, "warn",
        G_CALLBACK(native_console_warn), NULL, NULL, G_TYPE_NONE);
    JSCValue *error = jsc_value_new_function_variadic(ctx, "error",
        G_CALLBACK(native_console_error), NULL, NULL, G_TYPE_NONE);
    JSCValue *info = jsc_value_new_function_variadic(ctx, "info",
        G_CALLBACK(native_console_info), NULL, NULL, G_TYPE_NONE);

    jsc_value_object_set_property(console, "log", log);
    jsc_value_object_set_property(console, "warn", warn);
    jsc_value_object_set_property(console, "error", error);
    jsc_value_object_set_property(console, "info", info);

    jsc_context_set_value(ctx, "console", console);

    g_object_unref(log);
    g_object_unref(warn);
    g_object_unref(error);
    g_object_unref(info);
    g_object_unref(console);
}
