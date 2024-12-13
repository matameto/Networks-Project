function addToWantToGo(destination) {
    fetch('/addToWantToGo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination: destination })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Added to Want to Go list!');
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to add destination');
    });
}