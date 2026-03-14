#ifndef DOM_BRIDGE_H
#define DOM_BRIDGE_H

#include <jsc/jsc.h>

#ifdef __cplusplus
extern "C" {
#endif

// Register native DOM bridge functions into JSC context
void register_dom_bridge_shim(JSCContext *ctx);

// Parse HTML content into litehtml document, making elements queryable
// Call after register_dom_bridge_shim and before loading dom.js
void dom_bridge_load_html(JSCContext *ctx, const char *html);

// Render HTML overlay to GL texture and draw it (call each frame)
void dom_bridge_render(void);

// Cleanup
void dom_bridge_shutdown(void);

#ifdef __cplusplus
}
#endif

#endif // DOM_BRIDGE_H
