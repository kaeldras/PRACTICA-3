function generarEquipos() {
  const textarea = document.getElementById('participantes');
  const lista = textarea.value.split('\n').map(p => p.trim()).filter(p => p);

  if (lista.length > 100) {
    alert("No se permiten más de 100 participantes.");
    return;
  }

  const titulo = document.getElementById('tituloEquipo').value;
  const modo = document.getElementById('modo').value;
  const cantidad = parseInt(document.getElementById('cantidad').value);

  if (!cantidad || cantidad <= 0) {
    alert("Ingrese una cantidad válida.");
    return;
  }

  const participantes = [...lista];
  for (let i = participantes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participantes[i], participantes[j]] = [participantes[j], participantes[i]];
  }

  let equipos = [];
  if (modo === 'equipos') {
    equipos = Array.from({ length: cantidad }, () => []);
    participantes.forEach((p, i) => equipos[i % cantidad].push(p));
  } else {
    const numEquipos = Math.ceil(participantes.length / cantidad);
    equipos = Array.from({ length: numEquipos }, () => []);
    participantes.forEach((p, i) => equipos[Math.floor(i / cantidad)].push(p));
  }

  document.getElementById('configuracion').classList.add('hidden');
  document.getElementById('resultados').classList.remove('hidden');
  document.getElementById('titulo').textContent = titulo;

  const container = document.getElementById('equiposContainer');
  container.innerHTML = '';
  equipos.forEach((equipo, idx) => {
    const div = document.createElement('div');
    div.className = 'equipo';
    div.innerHTML = `<h3>Equipo ${idx + 1}</h3><ul>${equipo.map(p => `<li>${p}</li>`).join('')}</ul>`;
    container.appendChild(div);
  });
}

function descargarComoImagen() {
  html2canvas(document.getElementById('resultados')).then(canvas => {
    const link = document.createElement('a');
    link.download = 'equipos.jpg';
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
  });
}

function copiarAlPortapapeles() {
  const text = document.getElementById('equiposContainer').innerText;
  navigator.clipboard.writeText(text).then(() => alert("Copiado al portapapeles"));
}

function copiarPorColumnas() {
  const equipos = document.querySelectorAll('.equipo ul');
  const columnas = Array.from(equipos).map(ul => Array.from(ul.children).map(li => li.textContent));
  let maxLen = Math.max(...columnas.map(c => c.length));
  let resultado = '';
  for (let i = 0; i < maxLen; i++) {
    resultado += columnas.map(c => c[i] || '').join('\t') + '\n';
  }
  navigator.clipboard.writeText(resultado).then(() => alert("Equipos copiados por columnas"));
}

