#include "engine.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <libgen.h>

char *engine_read_file(const char *path, size_t *out_len) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;

    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *buf = malloc(len + 1);
    if (!buf) { fclose(f); return NULL; }

    size_t read = fread(buf, 1, len, f);
    buf[read] = '\0';
    fclose(f);

    if (out_len) *out_len = read;
    return buf;
}

char *engine_resolve_path(const char *url) {
    if (!url) return NULL;

    // Strip leading ./ if present
    if (url[0] == '.' && url[1] == '/') url += 2;

    // If absolute path, return as-is
    if (url[0] == '/') return strdup(url);

    // Resolve relative to game_dir
    const char *base = g_engine.game_dir;
    if (!base) base = ".";

    size_t len = strlen(base) + strlen(url) + 2;
    char *resolved = malloc(len);
    snprintf(resolved, len, "%s/%s", base, url);
    return resolved;
}
