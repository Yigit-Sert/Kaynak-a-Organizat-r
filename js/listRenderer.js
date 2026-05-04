export function renderList(items, container, callbacks, newItemId = null) {
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<li class="empty-list">Henüz bir kaynakça eklenmedi. Sol taraftaki formu kullanarak yeni kayıt oluşturabilirsiniz.</li>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.dataset.id = item.id;

        if (item.id === newItemId) {
            li.classList.add('highlight-animation');
        }

        const textContainer = document.createElement('div');
        textContainer.className = 'item-text';
        textContainer.innerHTML = item.olusturulanMetin;

        const metaInfo = document.createElement('div');
        metaInfo.className = 'item-meta';
        metaInfo.textContent = `Kural: ${item.kategori}`;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'item-actions';

        const btnCopy = document.createElement('button');
        btnCopy.className = 'btn-small btn-copy';
        btnCopy.textContent = 'Kopyala';
        btnCopy.setAttribute('data-copy-tooltip', "Word'e yapıştırmaya hazır");
        btnCopy.addEventListener('click', () => callbacks.onCopy(item.olusturulanMetin, btnCopy));

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-small btn-secondary';
        btnEdit.textContent = 'Düzenle';
        btnEdit.addEventListener('click', () => callbacks.onEdit(item));

        const btnManualEdit = document.createElement('button');
        btnManualEdit.className = 'btn-small btn-secondary';
        btnManualEdit.textContent = 'Manuel Düzenle';
        
        btnManualEdit.addEventListener('click', () => {
            if(btnManualEdit.textContent === 'Manuel Düzenle') {
                textContainer.contentEditable = "true";
                textContainer.style.border = "1px dashed var(--accent-color)";
                textContainer.style.padding = "5px";
                textContainer.focus();
                btnManualEdit.textContent = 'Kaydet';
                btnManualEdit.classList.remove('btn-secondary');
                btnManualEdit.classList.add('btn-primary');
            } else {
                textContainer.contentEditable = "false";
                textContainer.style.border = "none";
                textContainer.style.padding = "0";
                callbacks.onManualEdit(item.id, textContainer.innerHTML);
                
                btnManualEdit.textContent = 'Manuel Düzenle';
                btnManualEdit.classList.remove('btn-primary');
                btnManualEdit.classList.add('btn-secondary');
            }
        });

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-small btn-danger';
        btnDelete.textContent = 'Sil';
        btnDelete.addEventListener('click', () => callbacks.onDelete(item.id));

        actionsContainer.appendChild(btnCopy);
        actionsContainer.appendChild(btnEdit);
        actionsContainer.appendChild(btnManualEdit);
        actionsContainer.appendChild(btnDelete);

        li.appendChild(textContainer);
        li.appendChild(metaInfo);
        li.appendChild(actionsContainer);
        container.appendChild(li);
    });
}