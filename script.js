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

function goToDestination(destinationName) {
    alert(`Navigating to the section for: ${destinationName}`);
    // In a real website, you would implement actual navigation here,
    // likely using links to different pages or scrolling to specific sections.
}
