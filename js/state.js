const STORAGE_KEY = 'isnad_bibliography_data';

let bibliographyList = [];

export const state = {
    init() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                bibliographyList = JSON.parse(savedData);
            } catch (error) {
                console.error("Veri okuma hatası:", error);
                bibliographyList = [];
            }
        }
        return bibliographyList;
    },

    getItems() {
        return bibliographyList;
    },

    addItem(kategori, formVerileri, olusturulanMetin) {
        const newItem = {
            id: crypto.randomUUID(),
            kategori: kategori,
            formVerileri: formVerileri,
            olusturulanMetin: olusturulanMetin,
            timestamp: new Date().toISOString()
        };

        bibliographyList.push(newItem);
        this.sortList();
        this.save();
        
        return newItem;
    },

    deleteItem(id) {
        bibliographyList = bibliographyList.filter(item => item.id !== id);
        this.save();
    },

    updateItem(id, updatedText) {
        const index = bibliographyList.findIndex(item => item.id === id);
        if (index !== -1) {
            bibliographyList[index].olusturulanMetin = updatedText;
            this.sortList();
            this.save();
        }
    },

    clearAll() {
        bibliographyList = [];
        this.save();
    },

    sortList() {
        bibliographyList.sort((a, b) => {
            const textA = a.olusturulanMetin.replace(/<[^>]*>?/gm, '').toLowerCase();
            const textB = b.olusturulanMetin.replace(/<[^>]*>?/gm, '').toLowerCase();
            
            return textA.localeCompare(textB, 'tr');
        });
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bibliographyList));
    }
};