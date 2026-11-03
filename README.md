# Viver Inteira

Planner para a mulher católica cuidar da fé, do corpo e da rotina. Web app instalável no celular.

- Site estático publicado pelo GitHub Pages.
- Login por e-mail e senha e dados no Supabase (tabela `viver`, cada pessoa só vê a própria linha).
- Enquanto `config.js` estiver com `COLE_AQUI`, o app abre em modo de teste (salva só no aparelho).
- Textos (frases, sugestões, treinos, desafios) ficam em `conteudo.js`.

## Configurar
1. No Supabase, rode `supabase.sql` no SQL Editor.
2. Cole o Project URL e a chave anon public em `config.js`.
3. No GitHub: Settings → Pages → Deploy from a branch → `main` / root.
