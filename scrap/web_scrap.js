async function runExtraction() {
    function parseLi(li) {
        const a = li.querySelector(':scope > a');
        const item = {
            title: a ? a.innerText.trim() : '',
            url: a ? a.href : ''
        };
        
        const childrenUl = li.querySelector(':scope > ul.children');
        if (childrenUl) {
            item.children = [];
            const childLis = childrenUl.querySelectorAll(':scope > li');
            for (let childLi of childLis) {
                item.children.push(parseLi(childLi));
            }
        }
        return item;
    }

    async function fetchDetails(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const details = {};
            const rows = doc.querySelectorAll('tr'); 
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const key = cells[0].innerText.trim();
                    if (key === 'Kaynakçada' || key === 'Örnek') {
                        details[key] = cells[1].innerHTML.trim(); 
                    }
                }
            });
            return details;
        } catch (error) {
            console.error(`Sayfa verisi çekilemedi (${url}):`, error);
            return null;
        }
    }

    let totalLeaves = 0;
    let processedLeaves = 0;

    function countLeaves(items) {
        for (let item of items) {
            if (item.children && item.children.length > 0) {
                countLeaves(item.children);
            } else if (item.url && item.url.startsWith('http')) {
                totalLeaves++;
            }
        }
    }

    async function enrichData(items) {
        for (let item of items) {
            if (item.children && item.children.length > 0) {
                await enrichData(item.children);
            } else if (item.url && item.url.startsWith('http')) {
                processedLeaves++;
                console.log(`[${processedLeaves} / ${totalLeaves}] Veri çekiliyor: ${item.title} ...`);
                
                const details = await fetchDetails(item.url);
                if (details && Object.keys(details).length > 0) {
                    item.details = details; 
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    const knownLi = document.querySelector('li.page-item-1405') || document.querySelector('li.page_item_has_children');
    
    if (!knownLi) {
        console.error("Menü yapısı sayfada bulunamadı! İsnad menüsünün olduğu bir sayfada olduğunuza emin olun.");
        return;
    }

    const parentMenuUl = knownLi.parentElement;
    const allTopLevelLis = parentMenuUl.querySelectorAll(':scope > li');
    
    console.log("Adım 1: Tüm liste hiyerarşisi çıkarılıyor...");
    const dataTree = [];
    
    for (let li of allTopLevelLis) {
        dataTree.push(parseLi(li));
    }

    countLeaves(dataTree);
    console.log(`Toplam ${totalLeaves} adet alt kırılım (sayfa) bulundu.`);
    console.log("Adım 2: Linklerin içindeki tablolardan veriler toplanıyor, lütfen bekleyin...");
    
    await enrichData(dataTree);

    console.log("🎉 İşlem Başarılı! JSON Çıktısı Aşağıdadır:");
    const jsonOutput = JSON.stringify(dataTree, null, 2);
    console.log(jsonOutput);
}

runExtraction();