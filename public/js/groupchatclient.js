const socket = io();
const presentUser = document.getElementById('presentUser').textContent;

document.addEventListener('DOMContentLoaded', function() { 
socket.on('message', data => {
    
    
    // Make sure DOMContentLoaded event listener is necessary here
    const list = document.getElementById('myList');
        const newItem = document.createElement('li');
        
        // Check if the username matches the presentUser
        if (data[1] === presentUser) {
            newItem.innerHTML = `
                <div class="card ml-auto chatrod" style="background-color: rgb(226, 255, 199);">
                    <div class="card-header" style="background-color: rgb(226, 255, 199);">${data[1]}</div>
                    <div class="card-body">
                        <blockquote class="blockquote mb-0">
                            <p>${data[0]}</p>
                        </blockquote>
                    </div>
                    <div class="card-footer text-muted text-right" style=" font-size: 1.3rem;background-color: rgb(226, 255, 199);">
                        ${data[2]}
                    </div>
                </div>`;
        } else {
            newItem.innerHTML = `
                <div class="card chatrod">
                    <div class="card-header">${data[1]}</div>
                    <div class="card-body">
                        <blockquote class="blockquote mb-0">
                            <p>${data[0]}</p>
                        </blockquote>
                    </div>
                    <div class="card-footer text-muted text-right" style="font-size: 1.3rem;">
                        ${data[2]}
                    </div>
                </div>`;
        }
       
        list.appendChild(newItem);
    
});
}); 
chaton.addEventListener('submit', e => {
    e.preventDefault()
    socket.emit('chatmessage', chaton.message_box.value)
    /* console.log('submit from msgfrom', chaton.message_box.value) */
    chaton.message_box.value = '';
    
})
socket.on('unauthorizedAccess', () => {
    // Redirect the user to the desired page (e.g., 404 error page)
    window.location.href = '/error404'; // Adjust the URL as per your application
});
