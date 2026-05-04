export async function copyRichText(htmlContent) {
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const plainText = tempDiv.textContent || tempDiv.innerText;

        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
        });

        await navigator.clipboard.write([clipboardItem]);
        return true;
        
    } catch (error) {
        console.error("Kopyalama işlemi başarısız oldu:", error);
        
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            await navigator.clipboard.writeText(tempDiv.textContent);
            return true;
        } catch (fallbackError) {
            console.error("Alternatif kopyalama da başarısız:", fallbackError);
            return false;
        }
    }
}