# Banco Digital para Vercel

Versão web do projeto de banco feito originalmente para terminal em Python.

## O que mudou

- O menu por `input()` virou uma interface web.
- Usuários, contas, saldo e extrato são salvos no `localStorage` do navegador.
- Cada conta tem saldo, extrato e contador de saques próprios.
- O projeto pode ser publicado na Vercel como site estático, sem servidor.

## Como rodar localmente

Abra o arquivo `index.html` no navegador ou sirva a pasta com qualquer servidor estático.

## Como publicar na Vercel

1. Envie estes arquivos para um repositório no GitHub.
2. Na Vercel, clique em `Add New Project`.
3. Importe o repositório.
4. Mantenha as configurações padrão e clique em `Deploy`.

Como é um projeto estático, não precisa configurar build command.
