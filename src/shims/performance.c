#include "engine.h"

static double native_performance_now(GPtrArray *args, gpointer user_data) {
    return engine_now_ms();
}

void register_performance_shim(JSCContext *ctx) {
    JSCValue *perf = jsc_value_new_object(ctx, NULL, NULL);
    JSCValue *now_fn = jsc_value_new_function_variadic(ctx, "now",
        G_CALLBACK(native_performance_now), NULL, NULL, G_TYPE_DOUBLE);

    jsc_value_object_set_property(perf, "now", now_fn);
    jsc_context_set_value(ctx, "performance", perf);

    g_object_unref(now_fn);
    g_object_unref(perf);
}
