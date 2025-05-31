document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const priceInput = document.getElementById('price-input');
    const addButton = document.getElementById('add-button');
    const photoButton = document.getElementById('photo-button');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const shoppingList = document.getElementById('shopping-list');
    const totalAmount = document.getElementById('total-amount');
    const completeButton = document.getElementById('complete-shopping');
    const shoppingHistory = document.getElementById('shopping-history');

    // Yerel depolamadan kayıtlı listeyi ve geçmişi yükle
    let items = JSON.parse(localStorage.getItem('shoppingList')) || [];
    let history = JSON.parse(localStorage.getItem('shoppingHistory')) || [];

    // Listeyi güncelle
    function updateList() {
        shoppingList.innerHTML = '';
        items.forEach((item, index) => {
            const li = document.createElement('li');
            
            // Ürün bilgileri
            const itemInfo = document.createElement('div');
            itemInfo.className = 'item-info';
            
            // Ürün adı ve fiyat
            const textContent = `${item.name} <span class="item-price">${parseFloat(item.price).toFixed(2)} TL</span>`;
            
            // Fotoğraf varsa göster
            if (item.photo) {
                const img = document.createElement('img');
                img.src = item.photo;
                img.style.maxWidth = '100px';
                img.style.borderRadius = '4px';
                li.appendChild(img);
            }
            
            itemInfo.innerHTML = textContent;
            li.appendChild(itemInfo);
            
            // Butonlar
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'barcode-button';
            editBtn.textContent = 'Düzenle';
            editBtn.onclick = () => startEditing(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.textContent = 'Sil';
            deleteBtn.onclick = () => deleteItem(index);
            
            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);
            li.appendChild(buttonContainer);
            
            shoppingList.appendChild(li);
        });
        updateTotal();
        saveToLocalStorage();
    }

    // Fotoğraf ekleme
    photoButton.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoDataUrl = e.target.result;
                photoPreview.innerHTML = `
                    <img src="${photoDataUrl}" alt="Ürün fotoğrafı">
                    <button class="remove-photo" onclick="removePhoto()">&times;</button>
                `;
                photoPreview.classList.add('active');
            };
            reader.readAsDataURL(file);
        }
    });

    // Fotoğrafı kaldır
    window.removePhoto = () => {
        photoPreview.innerHTML = '';
        photoPreview.classList.remove('active');
        photoInput.value = '';
    };

    // Toplam tutarı hesapla ve göster
    function updateTotal() {
        const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        totalAmount.textContent = total.toFixed(2);
    }

    // Düzenleme modunu başlat
    function startEditing(index) {
        const item = items[index];
        itemInput.value = item.name;
        priceInput.value = item.price;
        
        // Varsa fotoğrafı göster
        if (item.photo) {
            photoPreview.innerHTML = `
                <img src="${item.photo}" alt="Ürün fotoğrafı">
                <button class="remove-photo" onclick="removePhoto()">&times;</button>
            `;
            photoPreview.classList.add('active');
        }
        
        // Düzenlenen öğeyi sil
        deleteItem(index);
    }

    // Öğe sil
    function deleteItem(index) {
        items.splice(index, 1);
        updateList();
    }

    // Alışverişi tamamla
    completeButton.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Listede ürün bulunmuyor!');
            return;
        }

        const now = new Date();
        const completed = {
            date: now.toLocaleString('tr-TR'),
            items: [...items],
            total: items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
        };

        history.unshift(completed);
        localStorage.setItem('shoppingHistory', JSON.stringify(history));
        
        // Listeyi temizle
        items = [];
        updateList();
        updateHistory();
    });

    // Geçmiş alışverişleri göster
    function updateHistory() {
        shoppingHistory.innerHTML = '';
        history.forEach((shopping, index) => {
            const div = document.createElement('div');
            div.className = 'shopping-history-item';
            
            let itemsHtml = '';
            shopping.items.forEach(item => {
                itemsHtml += `
                    <div class="history-item">
                        <span>${item.name}</span>
                        <span>${parseFloat(item.price).toFixed(2)} TL</span>
                    </div>
                `;
            });

            div.innerHTML = `
                <div class="history-date">${shopping.date}</div>
                <div class="history-items">${itemsHtml}</div>
                <div class="history-total">Toplam: ${shopping.total.toFixed(2)} TL</div>
            `;
            
            shoppingHistory.appendChild(div);
        });
    }

    // Yerel depolamaya kaydet
    function saveToLocalStorage() {
        localStorage.setItem('shoppingList', JSON.stringify(items));
    }

    // Yeni öğe ekle
    function addItem() {
        const newItemName = itemInput.value.trim();
        const newItemPrice = parseFloat(priceInput.value) || 0;
        
        if (newItemName) {
            const newItem = {
                name: newItemName,
                price: newItemPrice
            };

            // Fotoğraf varsa ekle
            if (photoPreview.classList.contains('active')) {
                const img = photoPreview.querySelector('img');
                if (img) {
                    newItem.photo = img.src;
                }
            }

            items.push(newItem);
            itemInput.value = '';
            priceInput.value = '';
            removePhoto();
            updateList();
        }
    }

    // Event listeners
    addButton.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && priceInput.value) {
            addItem();
        }
    });
    priceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && itemInput.value) {
            addItem();
        }
    });

    // İlk yükleme
    updateList();
    updateHistory();
});
