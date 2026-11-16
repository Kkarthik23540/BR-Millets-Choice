function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

export function confirmAction({
  title = 'Confirmation',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes, Proceed',
  cancelText = 'No, Cancel',
  isDanger = false,
} = {}) {
  return new Promise((resolve) => {
    // Dismiss any open modal
    document.querySelectorAll('.brmc-modal-backdrop').forEach((el) => el.remove());

    const backdrop = document.createElement('div');
    backdrop.className = 'brmc-modal-backdrop';
    backdrop.innerHTML = `
      <div class="brmc-modal-card" role="dialog" aria-modal="true" aria-labelledby="brmc-modal-title">
        <div class="brmc-modal-header">
          <div class="brmc-modal-icon ${isDanger ? 'is-danger' : 'is-brand'}">${isDanger ? '⚠️' : '🌾'}</div>
          <div>
            <h3 class="h5 mb-0 fw-bold ${isDanger ? 'text-danger' : 'text-forest'}" id="brmc-modal-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="brmc-modal-body my-3">
          <p class="mb-0 text-secondary" style="font-size:0.95rem;line-height:1.5;">${escapeHtml(message)}</p>
        </div>
        <div class="brmc-modal-footer d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-modal-cancel>${escapeHtml(cancelText)}</button>
          <button type="button" class="btn btn-sm ${isDanger ? 'btn-danger' : 'btn-brand'}" data-modal-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    let finished = false;
    const finish = (accepted) => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', keyListener);
      backdrop.classList.add('is-closing');
      setTimeout(() => backdrop.remove(), 160);
      resolve(accepted);
    };

    const confirmBtn = backdrop.querySelector('[data-modal-confirm]');
    const cancelBtn = backdrop.querySelector('[data-modal-cancel]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => finish(true));
      confirmBtn.focus();
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => finish(false));
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) finish(false);
    });

    const keyListener = (e) => {
      if (e.key === 'Escape') finish(false);
    };
    document.addEventListener('keydown', keyListener);
  });
}
