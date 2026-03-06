set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)

# Cross-compiler (adjust prefix for your toolchain)
set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)

# Search paths for cross-compiled libraries
set(CMAKE_FIND_ROOT_PATH /usr/aarch64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Use GLES2 on ARM targets
set(USE_GLES ON CACHE BOOL "Use OpenGL ES 2.0" FORCE)
