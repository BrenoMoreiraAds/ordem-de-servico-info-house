/* ===== DADOS ===== */
let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
let ordens  = JSON.parse(localStorage.getItem("ordens"))  || [];
let editIdx = -1;
let editOSIdx = -1;
let osCounter = parseInt(localStorage.getItem("osCounter") || "0");

/* ===== INIT ===== */
document.getElementById("data").value = hoje();
document.getElementById("os_equipamento").addEventListener("change", function () {
  document.getElementById("field-outro").style.display = this.value === "Outro" ? "flex" : "none";
});

function hoje() {
  return new Date().toISOString().split("T")[0];
}

/* ===== ABAS ===== */
function mostrarAba(aba) {
  document.getElementById("aba-pecas").style.display = aba === "pecas" ? "block" : "none";
  document.getElementById("aba-os").style.display    = aba === "os"    ? "block" : "none";
  document.getElementById("btn-nav-pecas").classList.toggle("ativo", aba === "pecas");
  document.getElementById("btn-nav-os").classList.toggle("ativo", aba === "os");
}

/* ===== TOAST ===== */
function showToast(msg, emoji = "✅") {
  const t = document.getElementById("toast");
  t.innerHTML = emoji + " " + msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

/* ===== MODAL ===== */
function abrirModal(id) { document.getElementById(id).classList.add("open"); }
function fecharModal(id) { document.getElementById(id).classList.remove("open"); }
document.querySelectorAll(".modal-overlay").forEach(el => {
  el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
});

/* ===== WHATSAPP (sem duplicar 55) ===== */
function abrirWpp(tel, msg) {
  let num = tel.replace(/\D/g, "");
  if (!num.startsWith("55")) num = "55" + num;
  window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(msg), "_blank");
}

/* ===== BADGE PEÇA ===== */
function badgePeca(status) {
  const map = {
    "Pedido realizado":    "badge-pedido",
    "Peça em trânsito":    "badge-transito",
    "Peça chegou":         "badge-chegou",
    "Entregue ao cliente": "badge-entregue"
  };
  return `<span class="badge ${map[status] || "badge-pedido"}">${status}</span>`;
}

/* ===== BADGE OS ===== */
function badgeOS(status) {
  const map = { "Aguardando": "badge-aguardando", "Em andamento": "badge-andamento", "Pronto": "badge-pronto" };
  return `<span class="badge ${map[status] || "badge-aguardando"}">${status}</span>`;
}

/* ========== PEÇAS ========== */

function salvarPedido() {
  const n = document.getElementById("nome").value.trim();
  const m = document.getElementById("modelo").value.trim();
  if (!n || !m) { showToast("Preencha nome e modelo da peça.", "⚠️"); return; }
  pedidos.push({
    nome:      n,
    telefone:  document.getElementById("telefone").value,
    data:      document.getElementById("data").value,
    tipo:      document.getElementById("tipo").value,
    modelo:    m,
    status:    document.getElementById("status").value,
    obs:       document.getElementById("obs").value
  });
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
  listarPedidos();
  limparFormPeca();
  showToast("Pedido salvo com sucesso!");
}

function limparFormPeca() {
  ["nome","telefone","tipo","modelo","obs"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("data").value = hoje();
  document.getElementById("status").selectedIndex = 0;
}

function listarPedidos() {
  const tbody = document.getElementById("listaPedidos");
  const filtro = document.getElementById("buscar").value.toLowerCase();
  const filtrados = pedidos.filter(p =>
    p.nome.toLowerCase().includes(filtro) ||
    p.modelo.toLowerCase().includes(filtro) ||
    (p.tipo || "").toLowerCase().includes(filtro)
  );
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📭</div><p>Nenhum pedido encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtrados.map((p, _i) => {
    const i = pedidos.indexOf(p);
    return `<tr>
      <td><strong>${p.nome}</strong></td>
      <td>${p.telefone || "-"}</td>
      <td>${p.data || "-"}</td>
      <td>${p.tipo || "-"}</td>
      <td>${p.modelo}</td>
      <td>${badgePeca(p.status)}</td>
      <td class="actions">
        <button class="btn-icon btn-edit" onclick="editarPedido(${i})" title="Editar">✏️</button>
        <button class="btn-icon btn-del" onclick="excluirPedido(${i})" title="Excluir">🗑️</button>
        <button class="btn-icon" onclick="imprimirPedido(${i})" title="Imprimir">🖨️</button>
      </td>
    </tr>`;
  }).join("");
}

function editarPedido(i) {
  editIdx = i;
  const p = pedidos[i];
  document.getElementById("edit_nome").value     = p.nome;
  document.getElementById("edit_telefone").value = p.telefone;
  document.getElementById("edit_data").value     = p.data;
  document.getElementById("edit_tipo").value     = p.tipo;
  document.getElementById("edit_modelo").value   = p.modelo;
  document.getElementById("edit_status").value   = p.status;
  document.getElementById("edit_obs").value      = p.obs || "";
  abrirModal("modalPeca");
}

function confirmarEdicaoPeca() {
  if (editIdx < 0) return;
  pedidos[editIdx] = {
    nome:     document.getElementById("edit_nome").value.trim(),
    telefone: document.getElementById("edit_telefone").value,
    data:     document.getElementById("edit_data").value,
    tipo:     document.getElementById("edit_tipo").value,
    modelo:   document.getElementById("edit_modelo").value.trim(),
    status:   document.getElementById("edit_status").value,
    obs:      document.getElementById("edit_obs").value
  };
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
  listarPedidos();
  fecharModal("modalPeca");
  showToast("Pedido atualizado!");
  editIdx = -1;
}

function excluirPedido(i) {
  if (confirm("Excluir este pedido?")) {
    pedidos.splice(i, 1);
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
    listarPedidos();
    showToast("Pedido excluído.", "🗑️");
  }
}

function imprimirPedido(i) {
  const p = pedidos[i];
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = `
    <img src="img/WhatsApp Image 2026-02-05 at 10.08.03.jpg" class="print-logo">
    <h2>Pedido de Peça — Info House</h2><hr>
    <p><strong>Cliente:</strong> ${p.nome}</p>
    <p><strong>Telefone:</strong> ${p.telefone || "-"}</p>
    <p><strong>Data:</strong> ${p.data || "-"}</p>
    <p><strong>Tipo da peça:</strong> ${p.tipo || "-"}</p>
    <p><strong>Modelo:</strong> ${p.modelo}</p>
    <p><strong>Status:</strong> ${p.status}</p>
    <p><strong>Observações:</strong> ${p.obs || "-"}</p>
    <br><p>Assinatura do cliente: ________________________________</p>`;
  printArea.style.display = "block";
  window.print();
  printArea.style.display = "none";
}

/* ========== ORDENS DE SERVIÇO ========== */

function salvarOS() {
  const n  = document.getElementById("os_nome").value.trim();
  const pr = document.getElementById("os_problema").value.trim();
  if (!n || !pr) { showToast("Preencha nome e problema.", "⚠️"); return; }
  osCounter++;
  localStorage.setItem("osCounter", osCounter);
  let equip = document.getElementById("os_equipamento").value;
  if (equip === "Outro") equip = document.getElementById("os_outro").value || "Outro";
  ordens.push({
    num:         osCounter,
    nome:        n,
    telefone:    document.getElementById("os_telefone").value,
    equipamento: equip,
    problema:    pr,
    acessorios:  document.getElementById("os_acessorios").value,
    valor:       document.getElementById("os_valor").value,
    statusOS:    "Aguardando",
    dataCriacao: hoje()
  });
  localStorage.setItem("ordens", JSON.stringify(ordens));
  listarOS();
  limparFormOS();
  showToast("Ordem de Serviço #" + osCounter + " criada!");
}

function limparFormOS() {
  ["os_nome","os_telefone","os_problema","os_acessorios","os_outro","os_valor"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("os_equipamento").selectedIndex = 0;
  document.getElementById("field-outro").style.display = "none";
}

function listarOS() {
  const tbody = document.getElementById("listaOS");
  const filtro = (document.getElementById("buscarOS").value || "").toLowerCase();
  const filtrados = ordens.filter(o =>
    o.nome.toLowerCase().includes(filtro) ||
    o.equipamento.toLowerCase().includes(filtro) ||
    o.problema.toLowerCase().includes(filtro)
  );
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">🛠️</div><p>Nenhuma ordem encontrada.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtrados.map((o, _i) => {
    const i = ordens.indexOf(o);
    const val = o.valor ? "R$ " + parseFloat(o.valor).toFixed(2).replace(".", ",") : "-";
    return `<tr>
      <td><span class="os-num">#${String(o.num || (i+1)).padStart(4,"0")}</span></td>
      <td><strong>${o.nome}</strong></td>
      <td>${o.telefone || "-"}</td>
      <td>${o.equipamento}</td>
      <td>${o.problema.length > 40 ? o.problema.substring(0,40)+"..." : o.problema}</td>
      <td>${val}</td>
      <td>${badgeOS(o.statusOS)}</td>
      <td class="actions">
        <button class="btn-wpp" onclick="whatsEntrada(${i})" title="Avisar recebimento">📥</button>
        <button class="btn-wpp" onclick="whatsPronto(${i})" title="Avisar que ficou pronto">✅</button>
        <button class="btn-cobrar" onclick="whatsCobranca(${i})" title="Enviar valor ao cliente">💰</button>
        <button class="btn-icon btn-edit" onclick="editarOS(${i})" title="Editar">✏️</button>
        <button class="btn-icon" onclick="imprimirOS(${i})" title="Imprimir">🖨️</button>
        <button class="btn-icon btn-del" onclick="excluirOS(${i})" title="Excluir">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

function editarOS(i) {
  editOSIdx = i;
  const o = ordens[i];
  document.getElementById("eos_nome").value        = o.nome;
  document.getElementById("eos_telefone").value    = o.telefone;
  document.getElementById("eos_equipamento").value = o.equipamento;
  document.getElementById("eos_problema").value    = o.problema;
  document.getElementById("eos_acessorios").value  = o.acessorios || "";
  document.getElementById("eos_valor").value       = o.valor || "";
  document.getElementById("eos_status").value      = o.statusOS;
  abrirModal("modalOS");
}

function confirmarEdicaoOS() {
  if (editOSIdx < 0) return;
  ordens[editOSIdx] = {
    ...ordens[editOSIdx],
    nome:        document.getElementById("eos_nome").value.trim(),
    telefone:    document.getElementById("eos_telefone").value,
    equipamento: document.getElementById("eos_equipamento").value,
    problema:    document.getElementById("eos_problema").value,
    acessorios:  document.getElementById("eos_acessorios").value,
    valor:       document.getElementById("eos_valor").value,
    statusOS:    document.getElementById("eos_status").value
  };
  localStorage.setItem("ordens", JSON.stringify(ordens));
  listarOS();
  fecharModal("modalOS");
  showToast("Ordem atualizada!");
  editOSIdx = -1;
}

/* ===== ARTIGOS POR EQUIPAMENTO ===== */
function artigoEquip(equip) {
  const e = equip.toLowerCase();
  if (e.includes("impressora")) return "da sua Impressora";
  if (e.includes("notebook"))   return "do seu Notebook";
  if (e.includes("computador")) return "do seu Computador";
  if (e.includes("celular"))    return "do seu Celular";
  if (e.includes("tablet"))     return "do seu Tablet";
  if (e.includes("monitor"))    return "do seu Monitor";
  return `do seu ${equip}`;
}

function artigoEquipPronto(equip) {
  const e = equip.toLowerCase();
  if (e.includes("impressora")) return "Sua Impressora";
  if (e.includes("notebook"))   return "Seu Notebook";
  if (e.includes("computador")) return "Seu Computador";
  if (e.includes("celular"))    return "Seu Celular";
  if (e.includes("tablet"))     return "Seu Tablet";
  if (e.includes("monitor"))    return "Seu Monitor";
  return `Seu ${equip}`;
}

/* ===== WHATSAPP ===== */
function whatsEntrada(i) {
  const o = ordens[i];
  const msg = `Olá, ${o.nome}! Confirmamos o recebimento ${artigoEquip(o.equipamento)} aqui na Info House. Assim que tivermos novidades, te avisamos. Obrigado pela confiança! 😊`;
  ordens[i].statusOS = "Em andamento";
  localStorage.setItem("ordens", JSON.stringify(ordens));
  listarOS();
  abrirWpp(o.telefone, msg);
}

function whatsPronto(i) {
  const o = ordens[i];
  const msg = `Olá, ${o.nome}! ${artigoEquipPronto(o.equipamento)} está pronto e já pode ser retirado na Info House. Qualquer dúvida é só chamar. Te esperamos! ✅`;
  ordens[i].statusOS = "Pronto";
  localStorage.setItem("ordens", JSON.stringify(ordens));
  listarOS();
  abrirWpp(o.telefone, msg);
}

function whatsCobranca(i) {
  const o = ordens[i];
  if (!o.telefone) { showToast("Nenhum telefone cadastrado nessa OS.", "⚠️"); return; }
  if (!o.valor)    { showToast("Nenhum valor cadastrado nessa OS. Edite a OS primeiro.", "⚠️"); return; }
  const val = "R$ " + parseFloat(o.valor).toFixed(2).replace(".", ",");
  const msg = `Olá, ${o.nome}! O valor do serviço realizado ${artigoEquip(o.equipamento)} aqui na Info House ficou em *${val}*. Qualquer dúvida é só chamar. Obrigado! 😊`;
  abrirWpp(o.telefone, msg);
}

/* ===== IMPRIMIR OS ===== */
function imprimirOS(i) {
  const o = ordens[i];
  const printArea = document.getElementById("printArea");
  const val = o.valor ? "R$ " + parseFloat(o.valor).toFixed(2).replace(".", ",") : "-";
  printArea.innerHTML = `
    <img src="img/WhatsApp Image 2026-02-05 at 10.08.03.jpg" class="print-logo">
    <h2>Ordem de Serviço #${String(o.num || (i+1)).padStart(4,"0")} — Info House</h2><hr>
    <p><strong>Cliente:</strong> ${o.nome}</p>
    <p><strong>Telefone:</strong> ${o.telefone || "-"}</p>
    <p><strong>Data:</strong> ${o.dataCriacao || "-"}</p>
    <p><strong>Equipamento:</strong> ${o.equipamento}</p>
    <p><strong>Problema:</strong> ${o.problema}</p>
    <p><strong>Acessórios:</strong> ${o.acessorios || "-"}</p>
    <p><strong>Valor estimado:</strong> ${val}</p>
    <p><strong>Status:</strong> ${o.statusOS}</p>
    <br><p>Assinatura do cliente: ________________________________</p>`;
  printArea.style.display = "block";
  window.print();
  printArea.style.display = "none";
}

function excluirOS(i) {
  if (confirm("Excluir esta ordem de serviço?")) {
    ordens.splice(i, 1);
    localStorage.setItem("ordens", JSON.stringify(ordens));
    listarOS();
    showToast("OS excluída.", "🗑️");
  }
}

/* ===== INIT LISTAS ===== */
listarPedidos();
listarOS();
