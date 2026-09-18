/**
 * Shared by the compare page (server) and its picker (client).
 *
 * It lives here rather than in the client component because importing a value
 * from a "use client" module into a server component hands back a client
 * reference proxy, not the number — which silently breaks any arithmetic done
 * with it on the server.
 */
export const MAX_APPS = 4;
