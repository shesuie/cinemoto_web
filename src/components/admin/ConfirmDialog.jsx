export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onClose, busy = false }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <h2 id="confirm-title" className="text-base font-semibold text-[#1A2130]">{title}</h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="admin-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
                    <button type="button" className="admin-btn" onClick={onConfirm} disabled={busy}>{busy ? 'Saving…' : confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
