async function convert() {
    const input = document.getElementById('pdfInput').files[0];
    if (!input) return alert('請選擇 PDF 檔案');

    document.getElementById('status').textContent = '載入 PDF 中...';
    const download_file_block = document.getElementById('pptx-file');

    const file_container = document.querySelector('.file-container');

    const buffer = await input.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'CUSTOM', width: viewport.width / (96 * 3), height: viewport.height / (96 * 3) });
    pptx.layout = 'CUSTOM';

    const slideW = pptx.width;
    const slideH = pptx.height;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const dataUrl = canvas.toDataURL('image/png');

        const displayCanvas = document.createElement('canvas');
        const displayContext = displayCanvas.getContext('2d');
        displayCanvas.width = canvas.width / 3; // 縮小顯示
        displayCanvas.height = canvas.height / 3;
        displayContext.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);

        const displayContainer = document.createElement('div');
        displayContainer.style.display = 'flex';
        displayContainer.style.justifyContent = 'center';
        displayContainer.style.marginBottom = '10px';
        displayContainer.appendChild(displayCanvas);
        file_container.textContent = '';
        file_container.appendChild(displayContainer);

        const scale = 2;
        const dpi = 96;

        const imgW = canvas.width / (dpi * 3);
        const imgH = canvas.height / (dpi * 3);

        const offsetX = (slideW - imgW) / 2;
        const offsetY = (slideH - imgH) / 2;

        pptx.addSlide().addImage({
            data: dataUrl,
            x: offsetX,
            y: offsetY,
            w: imgW,
            h: imgH
        });

        document.getElementById('status').textContent = `${i}/${pdf.numPages}頁`;
    }

    document.getElementById('status').textContent = '完成轉換，正在下載...';
    download_file_block.style.display = 'flex';

    const originalFileName = input.name;
    const newFileName = originalFileName.replace(/\.pdf$/i, '.pptx');
    download_file_block.textContent = newFileName;
    download_file_block.onclick = () => {
        pptx.writeFile(newFileName);
    };

    pptx.writeFile(newFileName);
}
