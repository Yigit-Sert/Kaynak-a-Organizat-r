function parseTemplate(templateString) {
    let cleanString = templateString.replace(/<[^>]*>?/gm, '');
    
    let parts = cleanString.split(/[.,:]+/);
    
    let labels = parts.map(part => part.trim()).filter(part => part.length > 0);
    
    labels = labels.filter(label => label.length > 1 && label.toLowerCase() !== "ed" && label.toLowerCase() !== "çev" && label.toLowerCase() !== "nşr");
    
    return labels;
}

export function renderSubCategories(children, container, onLeafSelect) {
    container.innerHTML = '';

    const select = document.createElement('select');
    select.className = 'sub-category-select';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Alt Kategori Seçin --";
    select.appendChild(defaultOption);

    children.forEach((child, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = child.title;
        select.appendChild(option);
    });

    container.appendChild(select);

    select.addEventListener('change', (e) => {
        const selectedIndex = e.target.value;
        if (selectedIndex === "") return;

        const selectedChild = children[selectedIndex];

        if (selectedChild.children) {
            const newContainer = document.createElement('div');
            newContainer.className = 'input-group sub-group';
            container.appendChild(newContainer);
            renderSubCategories(selectedChild.children, newContainer, onLeafSelect);
        } 
        else if (selectedChild.details) {
            onLeafSelect(selectedChild);
        }
    });
}

export function renderForm(categoryData, formContainer) {
    formContainer.innerHTML = '';
    
    const kaynakcadaTpl = categoryData.details["Kaynakçada"];
    const ornekTpl = categoryData.details["Örnek"];
    
    const fields = parseTemplate(kaynakcadaTpl);
    
    fields.forEach((fieldLabel, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'input-group';
        
        const label = document.createElement('label');
        label.textContent = fieldLabel;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = fieldLabel;
        input.placeholder = `${fieldLabel} giriniz...`;
        
        if(fieldLabel.toLowerCase().includes('varsa') || fieldLabel.includes('x')) {
            input.required = false;
            label.setAttribute('data-tooltip', 'Bu alan eserin durumuna göre isteğe bağlıdır.');
            label.classList.add('optional-label');
            label.innerHTML += ' <span class="tooltip-icon">?</span>';
        } else {
            input.required = true;
        }

        groupDiv.appendChild(label);
        groupDiv.appendChild(input);
        formContainer.appendChild(groupDiv);
    });

    const hiddenCategory = document.createElement('input');
    hiddenCategory.type = 'hidden';
    hiddenCategory.name = '_kategori_title';
    hiddenCategory.value = categoryData.title;
    formContainer.appendChild(hiddenCategory);
    
    const hiddenTemplate = document.createElement('input');
    hiddenTemplate.type = 'hidden';
    hiddenTemplate.name = '_kaynakcada_template';
    hiddenTemplate.value = kaynakcadaTpl;
    formContainer.appendChild(hiddenTemplate);
}