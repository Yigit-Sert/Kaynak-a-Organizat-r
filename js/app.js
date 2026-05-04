import { isnadData } from './data.js';
import { renderSubCategories, renderForm } from './formBuilder.js';
import { state } from './state.js';
import { renderList } from './listRenderer.js';
import { copyRichText } from './clipboard.js'; 

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const form = document.getElementById('dynamic-form');
    form.addEventListener('submit', handleFormSubmit);
    
    const savedItems = state.init();
    updateListUI(savedItems);

    document.getElementById('btn-clear').addEventListener('click', handleClearAll);
    document.getElementById('btn-copy-all').addEventListener('click', handleCopyAll);
    document.getElementById('btn-export').addEventListener('click', handleExportJSON);
    document.getElementById('import-json').addEventListener('change', handleImportJSON);
    document.getElementById('btn-export-txt').addEventListener('click', handleExportTXT);
    document.getElementById('import-txt').addEventListener('change', handleImportTXT);

    window.addEventListener('beforeunload', (event) => {
        if (state.getItems().length > 0) {
            const warningMessage = "Değişiklikleriniz tarayıcınıza otomatik kaydedildi. Ancak farklı bir cihazda da çalışabilmek veya tam yedek almak için ayrılmadan önce verilerinizi dışa aktarmanız önerilir.";
            event.returnValue = warningMessage;
            return warningMessage;
        }
    });
});

function initApp() {
    const mainCategorySelect = document.getElementById('main-category');
    isnadData.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = item.title;
        mainCategorySelect.appendChild(option);
    });
    mainCategorySelect.addEventListener('change', handleMainCategoryChange);
}

function handleMainCategoryChange(event) {
    const selectedIndex = event.target.value;
    const subCategoryContainer = document.getElementById('category-selectors');
    const dynamicForm = document.getElementById('dynamic-form');
    const dynamicInputs = document.getElementById('dynamic-inputs');
    
    const existingSubMenus = subCategoryContainer.querySelectorAll('.sub-category-select, .sub-group');
    existingSubMenus.forEach(el => el.remove());
    dynamicForm.classList.add('hidden');
    dynamicInputs.innerHTML = '';
    delete dynamicForm.dataset.editId; 
    document.getElementById('btn-submit').textContent = "Kaynakçayı Oluştur";

    if (selectedIndex === "") return;
    const selectedCategory = isnadData[selectedIndex];

    if (selectedCategory.children) {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group sub-group';
        subCategoryContainer.appendChild(wrapper);
        renderSubCategories(selectedCategory.children, wrapper, (leafCategory) => {
            activateForm(leafCategory, dynamicForm, dynamicInputs);
        });
    } else if (selectedCategory.details) {
        activateForm(selectedCategory, dynamicForm, dynamicInputs);
    }
}

function activateForm(categoryData, formEl, inputsContainer) {
    renderForm(categoryData, inputsContainer);
    formEl.classList.remove('hidden'); 
}

function handleFormSubmit(event) {
    event.preventDefault(); 
    const form = event.target;
    const formData = new FormData(form);
    const editId = form.dataset.editId; 
    
    const kategori = formData.get('_kategori_title');
    let sablon = formData.get('_kaynakcada_template');
    
    const formVerileri = {};
    for (let [key, value] of formData.entries()) {
        if (!key.startsWith('_')) { 
            formVerileri[key] = value.trim();
        }
    }

    let nihaiMetin = sablon;
    for (const [key, value] of Object.entries(formVerileri)) {
        if (value === "") {
            nihaiMetin = nihaiMetin.replace(new RegExp(`[,.\\s]*${key}[,.\\s]*`, 'g'), ' ');
        } else {
            nihaiMetin = nihaiMetin.replace(key, value);
        }
    }

    const formatliMetin = `<span style='font-family: "Times New Roman", Times, serif; font-size: 12pt;'>${nihaiMetin.trim()}</span>`;

    if (editId) {
        state.deleteItem(editId); 
        delete form.dataset.editId;
        document.getElementById('btn-submit').textContent = "Kaynakçayı Oluştur";
    }

    const yeniKayit = state.addItem(kategori, formVerileri, formatliMetin);
    updateListUI(state.getItems(), yeniKayit.id);
    form.reset();
}

function updateListUI(items, newItemId = null) {
    const listContainer = document.getElementById('bibliography-list');
    
    const listCallbacks = {
        onDelete: (id) => {
            if(confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
                state.deleteItem(id);
                updateListUI(state.getItems());
            }
        },
        onCopy: async (metin, btnElement) => {
            const success = await copyRichText(metin);
            if (success) {
                const originalText = btnElement.textContent;
                btnElement.textContent = 'Kopyalandı!';
                btnElement.classList.add('success-text');
                setTimeout(() => {
                    btnElement.textContent = originalText;
                    btnElement.classList.remove('success-text');
                }, 1500);
            }
        },
        onEdit: (item) => { 
            const form = document.getElementById('dynamic-form');
            const dynamicInputs = document.getElementById('dynamic-inputs');
            
            for (const [key, value] of Object.entries(item.formVerileri)) {
                const input = dynamicInputs.querySelector(`[name="${key}"]`);
                if (input) input.value = value;
            }
            
            form.dataset.editId = item.id;
            document.getElementById('btn-submit').textContent = "Kaydı Güncelle";
            form.scrollIntoView({ behavior: 'smooth' });
        },
        onManualEdit: (id, updatedText) => {
            state.updateItem(id, updatedText);
        }
    };

    renderList(items, listContainer, listCallbacks, newItemId);
}

function handleClearAll() {
    if (state.getItems().length === 0) return;
    if (confirm("Tüm listeniz ve tarayıcı önbelleğiniz silinecek. Emin misiniz?")) {
        state.clearAll();
        updateListUI([]);
    }
}

async function handleCopyAll(event) {
    const items = state.getItems();
    if (items.length === 0) return;
    const combinedHtml = items.map(item => item.olusturulanMetin).join('<br><br>');
    const success = await copyRichText(combinedHtml);
    if (success) {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = "Word'e Yapıştırmaya Hazır!";
        btn.classList.add('success-text');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success-text');
        }, 2000);
    }
}

function handleExportJSON() {
    const items = state.getItems();
    if (items.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "isnad_kaynakca_listem.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if(confirm("Mevcut listenizin üzerine yazılacak. Onaylıyor musunuz?")) {
                state.clearAll();
                importedData.forEach(item => state.addItem(item.kategori, item.formVerileri, item.olusturulanMetin));
                updateListUI(state.getItems());
            }
        } catch (error) {
            alert("Geçersiz JSON dosyası!");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function handleExportTXT() {
    const items = state.getItems();
    if (items.length === 0) return;
    const textContent = items.map(item => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.olusturulanMetin;
        return tempDiv.textContent || tempDiv.innerText;
    }).join('\n');

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent);
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", "isnad_kaynakca_listem.txt");
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
}

function handleImportTXT(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        lines.forEach(line => {
            if(line.trim().length > 0) {
                const formatliMetin = `<span style='font-family: "Times New Roman", Times, serif; font-size: 12pt;'>${line.trim()}</span>`;
                state.addItem("Manuel Kayıt (TXT'den Aktarıldı)", {}, formatliMetin);
            }
        });
        updateListUI(state.getItems());
    };
    reader.readAsText(file);
    event.target.value = '';
}