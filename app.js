let presets = [];
let editingId = null;
let audioUnlocked = false;

const presetNameInput = document.getElementById("presetName");
const addTimeBtn = document.getElementById("addTimeBtn");
const timeContainer = document.getElementById("timeContainer");
const savePresetBtn = document.getElementById("savePresetBtn");
const presetList = document.getElementById("presetList");
const alarmSound = document.getElementById("alarmSound");

document.addEventListener("click", unlockAudioOnce);

function unlockAudioOnce(){
    if(audioUnlocked) return;
    alarmSound.play().then(()=>{
        alarmSound.pause();
        alarmSound.currentTime = 0;
        audioUnlocked = true;
    }).catch(()=>{});
}

window.onload = () => {
    loadPresets();
    renderPresets();
    setInterval(checkAlarms, 1000);
};

addTimeBtn.onclick = () => addTimeField();

function addTimeField(value=""){
    const input = document.createElement("input");
    input.type = "time";
    input.className = "alarmTime";
    input.value = value;
    timeContainer.appendChild(input);
}

savePresetBtn.onclick = () => {

    const name = presetNameInput.value.trim();
    if(!name) return alert("Enter preset name");

    const times = [...document.querySelectorAll(".alarmTime")]
    .map(t=>t.value).filter(Boolean);

    if(!times.length) return alert("Add at least one time");

    const days = [...document.querySelectorAll(".days input:checked")]
    .map(d=>d.value);

    const presetData = {
        id: editingId || Date.now(),
        name,
        times,
        days,
        lastTriggered: null,
        playCount: 0
    };

    if(editingId){
        presets = presets.map(p => p.id === editingId ? presetData : p);
        editingId = null;
    } else {
        presets.push(presetData);
    }

    savePresets();
    renderPresets();
    clearForm();
};

function savePresets(){
    localStorage.setItem("alarm-presets", JSON.stringify(presets));
}

function loadPresets(){
    presets = JSON.parse(localStorage.getItem("alarm-presets") || "[]");
}

function clearForm(){
    presetNameInput.value="";
    timeContainer.innerHTML="";
    addTimeField();
    document.querySelectorAll(".days input").forEach(d=>d.checked=false);
}

function renderPresets(){

    if(!presets.length){
        presetList.innerHTML="<p>No presets</p>";
        return;
    }

    presetList.innerHTML = presets.map(p => `
        <div class="preset">
            <b>${p.name}</b><br>
            Times: ${p.times.join(", ")}<br>
            Days: ${p.days.length ? p.days.join(", ") : "All Days"}<br>
            <button onclick="editPreset(${p.id})">Edit</button>
            <button onclick="deletePreset(${p.id})">Delete</button>
        </div>
    `).join("");
}

function editPreset(id){
    const p = presets.find(x=>x.id===id);
    editingId = id;

    presetNameInput.value = p.name;
    timeContainer.innerHTML="";
    p.times.forEach(t=>addTimeField(t));

    document.querySelectorAll(".days input")
    .forEach(d=> d.checked = p.days.includes(d.value));
}

function deletePreset(id){
    if(!confirm("Delete this preset?")) return;
    presets = presets.filter(p=>p.id!==id);
    savePresets();
    renderPresets();
}

function checkAlarms(){

    const now = new Date();
    const timeNow = now.toTimeString().slice(0,5);
    const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const today = dayNames[now.getDay()];

    presets.forEach(p=>{

        const dayMatch = p.days.length===0 || p.days.includes(today);
        const timeMatch = p.times.includes(timeNow);

        if(dayMatch && timeMatch){

            if(p.lastTriggered !== timeNow){
                p.playCount = 0;
                p.lastTriggered = timeNow;
            }

            if(p.playCount < 2){
                triggerAlarm();
                p.playCount++;
            }

            savePresets();
        }

    });
}

function triggerAlarm(){
    alarmSound.currentTime=0;
    alarmSound.play();
}
