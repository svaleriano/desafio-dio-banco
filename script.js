 depositForm: document.querySelector("#depositForm"),
  withdrawForm: document.querySelector("#withdrawForm"),
  userForm: document.querySelector("#userForm"),
  userCep: document.querySelector("#userCep"),
  userNumber: document.querySelector("#userNumber"),
  userComplement: document.querySelector("#userComplement"),
  userAddress: document.querySelector("#userAddress"),
  accountForm: document.querySelector("#accountForm"),
  statementList: document.querySelector("#statementList"),
  userList: document.querySelector("#userList"),
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

["#userName", "#userAddress"].forEach((selector) => {
["#userName", "#userAddress", "#userComplement"].forEach((selector) => {
  document.querySelector(selector).addEventListener("blur", (event) => {
    event.target.value = toTitleCase(event.target.value);
  });
});

els.userCep.addEventListener("input", (event) => {
  event.target.value = formatCep(event.target.value);
});

els.userCep.addEventListener("blur", async () => {
  const cep = normalizeDigits(els.userCep.value);
  if (!cep) return;
  if (!isValidCep(cep)) return showNotice("Informe um CEP com 8 números.", "error");

  await fillAddressByCep(cep);
});

els.accountSelect.addEventListener("change", (event) => {
  state.activeAccountId = event.target.value || null;
  persist();
    name: toTitleCase(document.querySelector("#userName").value),
    cpf: normalizeCpf(document.querySelector("#userCpf").value),
    birthDate: document.querySelector("#userBirth").value,
    address: toTitleCase(document.querySelector("#userAddress").value),
    cep: normalizeDigits(els.userCep.value),
    address: buildFullAddress(),
  };

  if (!isValidCpf(user.cpf)) return showNotice("Informe um CPF com 11 números.", "error");
  if (!isValidCep(user.cep)) return showNotice("Informe um CEP com 8 números.", "error");
  if (state.users.some((item) => item.cpf === user.cpf)) {
    return showNotice("Já existe usuário com esse CPF.", "error");
  }
}

function normalizeCpf(cpf) {
  return cpf.replace(/\D/g, "");
  return normalizeDigits(cpf);
}

function isValidCpf(cpf) {
  return /^\d{11}$/.test(cpf);
}

function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function isValidCep(cep) {
  return /^\d{8}$/.test(cep);
}

function formatCep(value) {
  const digits = normalizeDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{0,3})/, (_, firstPart, secondPart) => {
    return secondPart ? `${firstPart}-${secondPart}` : firstPart;
  });
}

function formatCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
    });
}

async function fillAddressByCep(cep) {
  try {
    showNotice("Buscando endereço pelo CEP...");
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error("CEP indisponível");

    const data = await response.json();
    if (data.erro) return showNotice("CEP não encontrado.", "error");

    els.userAddress.value = toTitleCase(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
    showNotice("Endereço encontrado. Informe o número para concluir o cadastro.");
  } catch {
    showNotice("Não foi possível buscar o CEP agora. Preencha o endereço manualmente.", "error");
  }
}

function buildFullAddress() {
  const baseAddress = toTitleCase(els.userAddress.value);
  const number = els.userNumber.value.trim();
  const complement = toTitleCase(els.userComplement.value);

  if (!complement) return `${baseAddress}, Nº ${number}`;
  return `${baseAddress}, Nº ${number} - ${complement}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
