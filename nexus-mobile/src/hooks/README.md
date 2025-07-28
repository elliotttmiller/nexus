# Custom React Hooks

This directory contains custom React hooks for the Nexus Mobile app. These hooks are designed to simplify and standardize common patterns like loading and error state management, making your codebase more robust and less error-prone.

## Hooks

### `useLoading`
A hook for managing loading state in async operations.

**Usage:**
```js
const [loading, withLoading] = useLoading();
const handleAction = () => withLoading(async () => { /* ... */ });
```
- `loading`: boolean, true while the async function is running
- `withLoading(fn)`: wraps an async function, sets loading true/false automatically

### `useError`
A hook for managing error state in async operations.

**Usage:**
```js
const [error, setError, withError] = useError();
const handleAction = () => withError(async () => { /* ... */ });
```
- `error`: string | null, the current error message
- `setError`: function to manually set/clear error
- `withError(fn)`: wraps an async function, catches and sets error automatically

## Why Use These Hooks?
- Prevents bugs like infinite spinners or unhandled errors
- Reduces code duplication
- Makes async flows safer and more readable

## How to Adopt
- Replace manual loading/error state logic in your components with these hooks
- Use the `withLoading` and `withError` wrappers for all async actions

---

If you have questions or want to add more hooks, update this README! 