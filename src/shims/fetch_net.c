#include "engine.h"
#include <libsoup/soup.h>
#include <string.h>

static SoupSession *http_session = NULL;

// Async fetch callback: resolve the JS Promise when HTTP completes
static void on_fetch_complete(GObject *source, GAsyncResult *res, gpointer user_data) {
    JSCValue *callbacks = (JSCValue *)user_data;
    JSCContext *ctx = jsc_value_get_context(callbacks);

    JSCValue *resolve = jsc_value_object_get_property(callbacks, "resolve");
    JSCValue *reject = jsc_value_object_get_property(callbacks, "reject");

    SoupMessage *msg = soup_session_get_async_result_message(SOUP_SESSION(source), res);
    GError *error = NULL;
    GBytes *body_bytes = soup_session_send_and_read_finish(SOUP_SESSION(source), res, &error);

    if (error) {
        JSCValue *err = jsc_value_new_string(ctx, error->message);
        JSCValue *r = jsc_value_function_call(reject, JSC_TYPE_VALUE, err, G_TYPE_NONE);
        if (r) g_object_unref(r);
        g_object_unref(err);
        g_error_free(error);
    } else {
        guint status = soup_message_get_status(msg);
        gsize len = 0;
        const char *data = g_bytes_get_data(body_bytes, &len);

        JSCValue *result = jsc_value_new_object(ctx, NULL, NULL);
        jsc_value_object_set_property(result, "status", jsc_value_new_number(ctx, status));
        jsc_value_object_set_property(result, "ok",
            jsc_value_new_boolean(ctx, status >= 200 && status < 300));
        JSCValue *body_val = jsc_value_new_string(ctx, data ? g_strndup(data, len) : "");
        jsc_value_object_set_property(result, "body", body_val);
        g_object_unref(body_val);
        g_bytes_unref(body_bytes);

        JSCValue *r = jsc_value_function_call(resolve, JSC_TYPE_VALUE, result, G_TYPE_NONE);
        if (r) g_object_unref(r);
        g_object_unref(result);
    }

    g_object_unref(resolve);
    g_object_unref(reject);
    g_object_unref(callbacks);
}

// __httpFetchAsync(url, method, body, resolve, reject)
// Starts an async HTTP request. Calls resolve/reject when done.
static void native_http_fetch_async(GPtrArray *args, gpointer user_data) {
    if (args->len < 5) return;
    JSCContext *ctx = jsc_context_get_current();

    char *url = jsc_value_to_string(g_ptr_array_index(args, 0));
    char *method = jsc_value_to_string(g_ptr_array_index(args, 1));
    JSCValue *resolve = g_ptr_array_index(args, 3);
    JSCValue *reject = g_ptr_array_index(args, 4);

    if (!http_session) {
        http_session = soup_session_new();
        soup_session_set_timeout(http_session, 10);
    }

    SoupMessage *msg = soup_message_new(method, url);
    if (!msg) {
        fprintf(stderr, "[Fetch] Invalid URL: %s\n", url);
        JSCValue *err = jsc_value_new_string(ctx, "Invalid URL");
        JSCValue *r = jsc_value_function_call(reject, JSC_TYPE_VALUE, err, G_TYPE_NONE);
        if (r) g_object_unref(r);
        g_object_unref(err);
        g_free(url); g_free(method);
        return;
    }

    // Set request body if provided
    JSCValue *body_arg = g_ptr_array_index(args, 2);
    if (body_arg && !jsc_value_is_null(body_arg) && !jsc_value_is_undefined(body_arg)) {
        char *body = jsc_value_to_string(body_arg);
        GBytes *body_bytes = g_bytes_new_take(body, strlen(body));
        soup_message_set_request_body_from_bytes(msg, "application/json", body_bytes);
        g_bytes_unref(body_bytes);
    }

    // Store resolve/reject in an object so we can pass to the callback
    JSCValue *callbacks = jsc_value_new_object(ctx, NULL, NULL);
    jsc_value_object_set_property(callbacks, "resolve", resolve);
    jsc_value_object_set_property(callbacks, "reject", reject);

    // Start async request — completes via g_main_context_iteration in SDL loop
    soup_session_send_and_read_async(http_session, msg,
        G_PRIORITY_DEFAULT, NULL, on_fetch_complete, callbacks);

    g_object_unref(msg);
    g_free(url);
    g_free(method);
}

void register_fetch_net_shim(JSCContext *ctx) {
    JSCValue *fn = jsc_value_new_function_variadic(ctx, "__httpFetchAsync",
        G_CALLBACK(native_http_fetch_async), NULL, NULL, G_TYPE_NONE);
    jsc_context_set_value(ctx, "__httpFetchAsync", fn);
    g_object_unref(fn);

    // fetch() wrapper: file-based for local paths, async HTTP for URLs
    jsc_context_evaluate(ctx,
        "(function() {"
        "  var _fileFetch = window.fetch;"
        "  window.fetch = function(url, opts) {"
        "    var urlStr = (typeof url === 'object' && url.href) ? url.href : String(url);"
        "    if (urlStr.indexOf('http://') === 0 || urlStr.indexOf('https://') === 0) {"
        "      console.log('[Fetch] ' + (opts && opts.method || 'GET') + ' ' + urlStr);"
        "      return new Promise(function(resolve, reject) {"
        "        var method = (opts && opts.method) || 'GET';"
        "        var body = (opts && opts.body) || null;"
        "        __httpFetchAsync(urlStr, method, body,"
        "          function(result) {"
        "            resolve({"
        "              status: result.status,"
        "              ok: result.ok,"
        "              headers: new Map(),"
        "              text: function() { return Promise.resolve(result.body); },"
        "              json: function() { return Promise.resolve(JSON.parse(result.body)); },"
        "              arrayBuffer: function() {"
        "                var enc = new TextEncoder();"
        "                return Promise.resolve(enc.encode(result.body).buffer);"
        "              },"
        "              blob: function() { return Promise.resolve(new Blob([result.body])); }"
        "            });"
        "          },"
        "          function(err) { reject(new Error(String(err))); }"
        "        );"
        "      });"
        "    }"
        "    return _fileFetch ? _fileFetch(url, opts) : Promise.reject(new Error('No fetch handler for: ' + urlStr));"
        "  };"
        "})();"
        , -1);
}
