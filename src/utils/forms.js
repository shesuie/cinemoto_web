export function applyServerErrors(error, setError) {
    const entries = Object.entries(error?.errors || {});

    entries.forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages[0] : messages;

        if (typeof message === 'string') {
            setError(field, { type: 'server', message });
        }
    });

    return entries.length > 0;
}
