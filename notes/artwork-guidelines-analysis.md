# Integração das normas para envio da arte

A Central de documentação já fornece uma rota pública individual em `/documentos/:documentId` e um modelo persistido de documentos editáveis. As normas serão acrescentadas como o documento padrão `normas-envio-arte`, permitindo que o conteúdo enviado pelo usuário seja renderizado na página pública e alterado por administradores sem uma nova tabela de banco de dados.

> O botão **Ver normas para envio da arte** do configurador deve apontar diretamente para `/documentos/normas-envio-arte` em desktop e mobile.

> Para tornar a gestão mais clara, a navegação administrativa terá um item dedicado em **Configurações do site**, com uma tela focada nesse documento e ações de salvar, publicar e visualizar a página pública.

O editor institucional existente já salva documentos por meio de `siteContent.saveDocuments`, com permissões administrativas e consultas públicas separadas. A nova tela dedicada reutilizará esse fluxo, mantendo outros documentos intactos; a página pública usará a rota `/documentos/normas-envio-arte` e o configurador apontará diretamente para esse endereço.
