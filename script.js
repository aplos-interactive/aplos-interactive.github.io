function searchDestinations() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const destinationCards = document.querySelectorAll('.destination-card');

    destinationCards.forEach(card => {
        const destinationName = card.dataset.name.toLowerCase();
        if (destinationName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

