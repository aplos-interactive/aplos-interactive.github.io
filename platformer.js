const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameLoop = () => {
    
    update();

    
    draw();

    requestAnimationFrame(gameLoop);
};

const update = () => {
};

const draw = () => {
   
    ctx.clearRect(0, 0, canvas.width, canvas.height);

   
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
};

};
const player = {
    x: 100,            
    y: canvas.height - 50, 
    width: 30,          
    height: 50,         
    color: 'red',      
    velocityX: 0,       
    velocityY: 0,       
    isJumping: false    
    

requestAnimationFrame(gameLoop);
