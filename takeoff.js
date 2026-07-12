const TakeoffTool = {
    canvas: null,
    ctx: null,
    img: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    mode: 'none', // 'calibrate', 'draw_area'
    pixelsPerMeter: null,
    
    // For drawing lines/polygons
    currentPoints: [],
    completedShapes: [], // { type: 'area', points: [], area: 0, perimeter: 0, color: 'rgba(...)' }
    
    mousePos: { x: 0, y: 0 },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Event Listeners
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // Touch Support
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Disable context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        this.render();
    },

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    },

    loadImage(url) {
        this.img = new Image();
        this.img.onload = () => {
            // Reset view to fit image
            this.scale = Math.min(
                this.canvas.width / this.img.width,
                this.canvas.height / this.img.height
            ) * 0.9;
            this.offsetX = (this.canvas.width - this.img.width * this.scale) / 2;
            this.offsetY = (this.canvas.height - this.img.height * this.scale) / 2;
            this.render();
        };
        this.img.src = url;
    },

    screenToWorld(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    },

    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY
        };
    },

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);

        if (e.button === 1 || e.button === 2 || this.mode === 'none') {
            this.isDragging = true;
            this.dragStartX = screenX - this.offsetX;
            this.dragStartY = screenY - this.offsetY;
            return;
        }

        if (e.button === 0) {
            if (this.mode === 'calibrate') {
                this.currentPoints.push(worldPos);
                if (this.currentPoints.length === 2) {
                    this.promptCalibration();
                }
            } else if (this.mode === 'draw_area') {
                this.currentPoints.push(worldPos);
            }
        }
        this.render();
    },

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        this.mousePos = this.screenToWorld(screenX, screenY);

        if (this.isDragging) {
            this.offsetX = screenX - this.dragStartX;
            this.offsetY = screenY - this.dragStartY;
        }
        this.render();
    },

    onMouseUp(e) {
        if (e.button === 1 || e.button === 2 || this.mode === 'none') {
            this.isDragging = false;
        }
    },

    onTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: this.mode === 'none' ? 1 : 0
            });
            this.onMouseDown(mouseEvent);
        }
    },

    onTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseMove(mouseEvent);
        }
    },

    onTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {
            button: this.mode === 'none' ? 1 : 0
        });
        this.onMouseUp(mouseEvent);
    },

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);
        
        this.offsetX = screenX - (screenX - this.offsetX) * zoomFactor;
        this.offsetY = screenY - (screenY - this.offsetY) * zoomFactor;
        this.scale *= zoomFactor;
        
        this.render();
    },

    promptCalibration() {
        const p1 = this.currentPoints[0];
        const p2 = this.currentPoints[1];
        const pixelDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        
        const realDist = prompt("Enter the real-world distance in METERS for this line:");
        if (realDist && !isNaN(realDist) && realDist > 0) {
            this.pixelsPerMeter = pixelDist / parseFloat(realDist);
            alert(`Scale set! 1 meter = ${this.pixelsPerMeter.toFixed(2)} pixels.`);
            document.getElementById('takeoffStatus').textContent = "Scale calibrated. Ready to draw area.";
        } else {
            document.getElementById('takeoffStatus').textContent = "Calibration cancelled.";
        }
        this.currentPoints = [];
        this.mode = 'none';
        this.render();
    },

    finishPolygon() {
        if (this.mode !== 'draw_area' || this.currentPoints.length < 3) {
            alert("Please draw at least 3 points before finishing.");
            return;
        }
        if (!this.pixelsPerMeter) {
            alert("Please Calibrate Scale first!");
            return;
        }

        let areaPixels = 0;
        let perimeterPixels = 0;
        const pts = this.currentPoints;
        for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            areaPixels += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
            perimeterPixels += Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        }
        areaPixels = Math.abs(areaPixels) / 2;

        const areaMeters = areaPixels / (this.pixelsPerMeter * this.pixelsPerMeter);
        const perimeterMeters = perimeterPixels / this.pixelsPerMeter;

        this.completedShapes.push({
            type: 'area',
            points: [...this.currentPoints],
            area: areaMeters,
            perimeter: perimeterMeters,
            color: 'rgba(212, 175, 55, 0.4)'
        });

        this.currentPoints = [];
        this.mode = 'none';
        document.getElementById('takeoffStatus').textContent = "Shape added.";
        this.render();
        this.updateTotals();
    },

    clearAll() {
        if(confirm("Are you sure you want to clear the canvas?")) {
            this.completedShapes = [];
            this.currentPoints = [];
            this.pixelsPerMeter = null;
            document.getElementById('takeoffStatus').textContent = "Cleared. Please upload image and Calibrate.";
            this.render();
            this.updateTotals();
        }
    },

    updateTotals() {
        let totalArea = 0;
        let totalPerimeter = 0;
        this.completedShapes.forEach(s => {
            totalArea += s.area;
            totalPerimeter += s.perimeter;
        });
        
        const disp = document.getElementById('takeoffResults');
        if (disp) {
            disp.innerHTML = `
                <div><strong>Area:</strong> <span style="color:#d4af37">${totalArea.toFixed(2)} m²</span></div>
                <div><strong>Perimeter:</strong> <span style="color:#d4af37">${totalPerimeter.toFixed(2)} m</span></div>
            `;
        }
        return { totalArea, totalPerimeter };
    },

    saveAndClose() {
        const { totalArea, totalPerimeter } = this.updateTotals();
        
        if (totalArea > 0) {
            const lengthInput = document.getElementById('length');
            const widthInput = document.getElementById('width');
            if (lengthInput && widthInput) {
                // To maintain l*w logic without heavy rewrite, trick it: 
                // Length = Area, Width = 1.
                lengthInput.value = totalArea.toFixed(2);
                widthInput.value = 1;
                lengthInput.dispatchEvent(new Event('input'));
                
                // Show user we used the takeoff
                const previewTitle = document.getElementById('previewTitle');
                if (previewTitle) previewTitle.innerHTML = `ESTIMATE (DIGITAL TAKEOFF APPLIED) <br><small style="color:var(--text-muted);font-size:0.7rem;">Area: ${totalArea.toFixed(2)}m² | Perim: ${totalPerimeter.toFixed(2)}m</small>`;
            }
        }
        document.getElementById('takeoffModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    render() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#121212';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        for(let i = 0; i < this.canvas.width; i+=50) {
            this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke();
        }
        for(let i = 0; i < this.canvas.height; i+=50) {
            this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke();
        }

        if (this.img) {
            this.ctx.drawImage(
                this.img, 
                this.offsetX, 
                this.offsetY, 
                this.img.width * this.scale, 
                this.img.height * this.scale
            );
        }

        this.completedShapes.forEach(shape => {
            if (shape.points.length > 0) {
                this.ctx.beginPath();
                const start = this.worldToScreen(shape.points[0].x, shape.points[0].y);
                this.ctx.moveTo(start.x, start.y);
                for (let i = 1; i < shape.points.length; i++) {
                    const pt = this.worldToScreen(shape.points[i].x, shape.points[i].y);
                    this.ctx.lineTo(pt.x, pt.y);
                }
                this.ctx.closePath();
                
                this.ctx.fillStyle = shape.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#d4af37';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                const centerWorld = this.getPolygonCenter(shape.points);
                const centerScreen = this.worldToScreen(centerWorld.x, centerWorld.y);
                this.ctx.fillStyle = '#121212';
                this.ctx.fillRect(centerScreen.x - 20, centerScreen.y - 10, 40, 20);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Poppins';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${shape.area.toFixed(1)}m²`, centerScreen.x, centerScreen.y);
            }
        });

        if (this.currentPoints.length > 0) {
            this.ctx.beginPath();
            const start = this.worldToScreen(this.currentPoints[0].x, this.currentPoints[0].y);
            this.ctx.moveTo(start.x, start.y);
            
            for (let i = 1; i < this.currentPoints.length; i++) {
                const pt = this.worldToScreen(this.currentPoints[i].x, this.currentPoints[i].y);
                this.ctx.lineTo(pt.x, pt.y);
            }
            
            const screenMouse = this.worldToScreen(this.mousePos.x, this.mousePos.y);
            this.ctx.lineTo(screenMouse.x, screenMouse.y);
            
            if (this.mode === 'draw_area') {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fill();
            }
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.currentPoints.forEach(p => {
                const pt = this.worldToScreen(p.x, p.y);
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#d4af37';
                this.ctx.fill();
            });
        }
    },

    getPolygonCenter(pts) {
        let x = 0, y = 0;
        pts.forEach(p => { x += p.x; y += p.y; });
        return { x: x / pts.length, y: y / pts.length };
    }
};
window.TakeoffTool = TakeoffTool;
