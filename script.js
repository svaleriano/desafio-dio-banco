const AGENCY = "0001";
const WITHDRAW_LIMIT = 500;
const MAX_WITHDRAWS = 3;
const STORAGE_KEY = "dio-banco-web-state";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const initialState = {
  users: [],
  accounts: [],
  activeAccountId: null,
};

let state = loadState();

const els = {
  accountSelect: document.querySelector("#accountSelect"),
  activeAccountNumber: document.querySelector("#activeAccountNumber"),
  accountUser: document.querySelector("#accountUser"),
  balance: document.querySelector("#balance"),
  withdrawCount: document.querySelector("#withdrawCount"),
  userCount: document.querySelector("#userCount"),
  accountCount: document.querySelector("#accountCount"),
  notice: document.querySelector("#notice"),
  depositForm: document.querySelector("#depositForm"),
  withdrawForm: document.querySelector("#withdrawForm"),
  userForm: document.querySelector("#userForm"),
  accountForm: document.querySelector("#accountForm"),
  statementList: document.querySelector("#statementList"),
  userList: document.querySelector("#userList"),
  accountList: document.querySelector("#accountList"),
  clearStatement: document.querySelector("#clearStatement"),
  resetData: document.querySelector("#resetData"),
};

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

["#userName", "#userAddress"].forEach((selector) => {
  document.querySelector(selector).addEventListener("blur", (event) => {
    event.target.value = toTitleCase(event.target.value);
  });
});

els.accountSelect.addEventListener("change", (event) => {
  state.activeAccountId = event.target.value || null;
  persist();
  render();
});

els.depositForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const account = getActiveAccount();
  const value = readMoney("#depositAmount");

  if (!account) return showNotice("Crie ou selecione uma conta antes de depositar.", "error");
  if (value <= 0) return showNotice("Informe um valor de depósito válido.", "error");

  account.balance += value;
  account.statement.unshift(createStatementItem("Depósito", value));
  persist();
  event.target.reset();
  showNotice("Depósito realizado com sucesso.");
  render();
});

els.withdrawForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const account = getActiveAccount();
  const value = readMoney("#withdrawAmount");

  if (!account) return showNotice("Crie ou selecione uma conta antes de sacar.", "error");
  if (value <= 0) return showNotice("Informe um valor de saque válido.", "error");
  if (value > account.balance) return showNotice("Saldo insuficiente para realizar o saque.", "error");
  if (value > WITHDRAW_LIMIT) return showNotice("O valor do saque excede o limite permitido.", "error");
  if (account.withdrawCount >= MAX_WITHDRAWS) return showNotice("Número máximo de saques excedido.", "error");

  account.balance -= value;
  account.withdrawCount += 1;
  account.statement.unshift(createStatementItem("Saque", -value));
  persist();
  event.target.reset();
  showNotice("Saque realizado com sucesso.");
  render();
});

els.userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = {
    id: createId(),
    name: toTitleCase(document.querySelector("#userName").value),
    cpf: normalizeCpf(document.querySelector("#userCpf").value),
    birthDate: document.querySelector("#userBirth").value,
    address: toTitleCase(document.querySelector("#userAddress").value),
  };

  if (!isValidCpf(user.cpf)) return showNotice("Informe um CPF com 11 números.", "error");
  if (state.users.some((item) => item.cpf === user.cpf)) {
    return showNotice("Já existe usuário com esse CPF.", "error");
  }

  state.users.push(user);
  persist();
  event.target.reset();
  showNotice("Usuário criado com sucesso.");
  render();
});

els.accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const userCpf = els.accountUser.value;
  const user = state.users.find((item) => item.cpf === userCpf);

  if (!user) return showNotice("Cadastre um usuário antes de criar a conta.", "error");

  const nextNumber = state.accounts.length + 1;
  const account = {
    id: createId(),
    agency: AGENCY,
    number: nextNumber,
    userCpf: user.cpf,
    balance: 0,
    withdrawCount: 0,
    statement: [],
  };

  state.accounts.push(account);
  state.activeAccountId = account.id;
  persist();
  event.target.reset();
  showNotice(`Conta criada para ${user.name}.`);
  render();
});

els.clearStatement.addEventListener("click", () => {
  const account = getActiveAccount();
  if (!account) return showNotice("Nenhuma conta selecionada.", "error");

  account.statement = [];
  persist();
  showNotice("Extrato limpo.");
  render();
});

els.resetData.addEventListener("click", () => {
  if (!confirm("Deseja apagar todos os usuários, contas, saldos e extratos?")) return;
  state = { ...initialState };
  localStorage.removeItem(STORAGE_KEY);
  showNotice("Todos os dados foram apagados.");
  render();
});

render();

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return savedState ? { ...initialState, ...savedState } : { ...initialState };
  } catch {
    return { ...initialState };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderAccountSelect();
  renderAccountUserSelect();

  const activeAccount = getActiveAccount();
  els.balance.textContent = currency.format(activeAccount?.balance ?? 0);
  els.withdrawCount.textContent = activeAccount?.withdrawCount ?? 0;
  els.activeAccountNumber.textContent = activeAccount ? `Conta ${activeAccount.number}` : "Sem conta";
  els.userCount.textContent = state.users.length;
  els.accountCount.textContent = state.accounts.length;

  renderStatement(activeAccount);
  renderUsers();
  renderAccounts();
}

function renderAccountSelect() {
  if (!state.accounts.length) {
    els.accountSelect.innerHTML = '<option value="">Nenhuma conta cadastrada</option>';
    els.accountSelect.disabled = true;
    return;
  }

  els.accountSelect.disabled = false;
  els.accountSelect.innerHTML = state.accounts
    .map((account) => {
      const user = getUserByCpf(account.userCpf);
      const label = `${account.agency} / ${account.number} - ${user?.name ?? "Titular removido"}`;
      return `<option value="${account.id}">${escapeHtml(label)}</option>`;
    })
    .join("");
  els.accountSelect.value = state.activeAccountId ?? state.accounts[0].id;
  state.activeAccountId = els.accountSelect.value;
}

function renderAccountUserSelect() {
  if (!state.users.length) {
    els.accountUser.innerHTML = '<option value="">Cadastre um usuário primeiro</option>';
    els.accountUser.disabled = true;
    return;
  }

  els.accountUser.disabled = false;
  els.accountUser.innerHTML = '<option value="">Selecione o titular</option>' + state.users
    .map((user) => `<option value="${user.cpf}">${escapeHtml(user.name)} - ${formatCpf(user.cpf)}</option>`)
    .join("");
}

function renderStatement(account) {
  if (!account || !account.statement.length) {
    els.statementList.innerHTML = '<li class="empty">Não foram realizadas movimentações.</li>';
    return;
  }

  els.statementList.innerHTML = account.statement
    .map((item) => {
      const amountClass = item.amount < 0 ? "danger" : "success";
      return `
        <li>
          <div class="row">
            <strong>${escapeHtml(item.type)}</strong>
            <strong class="${amountClass}">${currency.format(item.amount)}</strong>
          </div>
          <span class="muted">${escapeHtml(item.date)}</span>
        </li>
      `;
    })
    .join("");
}

function renderUsers() {
  if (!state.users.length) {
    els.userList.innerHTML = '<li class="empty">Nenhum usuário cadastrado.</li>';
    return;
  }

  els.userList.innerHTML = state.users
    .map(
      (user) => `
        <li>
          <strong>${escapeHtml(user.name)}</strong>
          <span class="muted">CPF ${formatCpf(user.cpf)} · Nascimento ${formatDate(user.birthDate)}</span>
          <span>${escapeHtml(user.address)}</span>
        </li>
      `,
    )
    .join("");
}

function renderAccounts() {
  if (!state.accounts.length) {
    els.accountList.innerHTML = '<li class="empty">Nenhuma conta cadastrada.</li>';
    return;
  }

  els.accountList.innerHTML = state.accounts
    .map((account) => {
      const user = getUserByCpf(account.userCpf);
      return `
        <li>
          <strong>Agência ${account.agency} · Conta ${account.number}</strong>
          <span class="muted">Titular: ${escapeHtml(user?.name ?? "Titular removido")}</span>
          <span>Saldo: ${currency.format(account.balance)}</span>
        </li>
      `;
    })
    .join("");
}

function getActiveAccount() {
  return state.accounts.find((account) => account.id === state.activeAccountId) ?? null;
}

function getUserByCpf(cpf) {
  return state.users.find((user) => user.cpf === cpf);
}

function createStatementItem(type, amount) {
  return {
    id: createId(),
    type,
    amount,
    date: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date()),
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setActiveTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function showNotice(message, type = "success") {
  els.notice.textContent = message;
  els.notice.className = `notice visible ${type === "error" ? "error" : ""}`;
}

function readMoney(selector) {
  const value = Number.parseFloat(document.querySelector(selector).value);
  return Number.isFinite(value) ? value : 0;
}

function normalizeCpf(cpf) {
  return cpf.replace(/\D/g, "");
}

function isValidCpf(cpf) {
  return /^\d{11}$/.test(cpf);
}

function formatCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
}

function toTitleCase(value) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .replace(/(^|[\s/-])(\p{L})/gu, (match, separator, letter) => {
      return separator + letter.toLocaleUpperCase("pt-BR");
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
