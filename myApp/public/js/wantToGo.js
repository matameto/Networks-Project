function addToWantToGo(destination) {
    const messageContainer = document.getElementById('message-container');
    
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
            messageContainer.style.color = 'lightgreen';
            messageContainer.textContent = 'Added to Want to Go list!';
        } else {
            messageContainer.style.color = 'red';
            messageContainer.textContent = data.message;
        }
        
        // Clear message after 3 seconds
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 3000);
    })
    .catch(error => {
        console.error('Error:', error);
        messageContainer.style.color = 'red';
        messageContainer.textContent = 'Destination is already in your Want to Go list';

        // Clear message after 3 seconds
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 3000);


    });
}



function removeDestination(destination) {
    fetch('/removeFromWantToGo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination: destination })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Refresh the page to show updated list
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to remove destination');
    });
}