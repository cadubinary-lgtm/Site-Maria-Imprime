import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

export const TERMS_OF_SALE_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Apresentação

Bem-vindo à Maria Imprime – Sua Gráfica Online.

Estes Termos e Condições de Venda estabelecem as regras aplicáveis à compra de produtos e serviços oferecidos pela Maria Imprime por meio de seu site e demais canais oficiais de atendimento.

Ao realizar uma compra, o cliente declara que teve acesso a estes Termos e aos demais documentos disponibilizados na Central de Documentação da Maria Imprime.

2. Definições

Para fins deste documento:

Cliente: pessoa física ou jurídica que realiza uma compra.
Arte: arquivo digital enviado pelo cliente para impressão.
Produto personalizado: produto produzido sob encomenda conforme medidas, materiais, acabamentos, quantidades ou artes escolhidas pelo cliente.
Pedido: contratação realizada pelo cliente por meio dos canais oficiais da Maria Imprime.
Produção: processo de fabricação do pedido após o cumprimento das condições necessárias para sua execução.

3. Aceitação dos Termos

Ao marcar a opção “Aceito os termos e condições” e concluir a compra, o cliente declara que teve acesso a estes Termos, compreendeu as condições aplicáveis à compra, está ciente das características dos produtos personalizados, do processo de impressão, das tolerâncias técnicas de produção e dos demais documentos da Maria Imprime.

O aceite eletrônico será associado ao respectivo pedido.

4. Cadastro do Cliente

O cliente deverá fornecer informações corretas, completas e atualizadas. Informações incorretas poderão causar problemas de comunicação, produção ou entrega. É responsabilidade do cliente manter seus dados atualizados.

5. Produtos Personalizados

Os produtos personalizados são produzidos conforme as especificações escolhidas pelo cliente no momento da compra, incluindo medidas, material, quantidade, acabamento, impressão, arte, cores, acessórios e demais características disponíveis para o produto.

Por serem produzidos de acordo com as especificações do pedido, alterações após o início da produção poderão não ser tecnicamente possíveis. Os direitos do consumidor previstos na legislação aplicável serão sempre respeitados.

6. Processo de Compra

O processo de compra poderá envolver escolha do produto, medidas, material, acabamento, quantidade, envio ou disponibilização da arte, conferência das informações, entrega, pagamento, aprovação da arte quando aplicável, produção e entrega ou retirada.

7. Pagamento

A produção será iniciada após a confirmação do pagamento e o cumprimento das demais condições necessárias ao pedido. Caso o pagamento não seja aprovado, o pedido poderá permanecer aguardando regularização ou ser cancelado conforme as condições aplicáveis.

As formas de pagamento, bandeiras, parcelamentos, limites e demais condições exibidos no checkout dependem da disponibilidade e das regras do processador de pagamentos homologado, bem como das análises e autorizações realizadas por ele e, quando aplicável, pela instituição financeira do cliente. A Maria Imprime poderá disponibilizar, restringir ou substituir modalidades de pagamento conforme essa disponibilidade, apresentando no checkout as opções efetivamente habilitadas para cada pedido. O cliente não deverá considerar como garantida uma modalidade que não esteja disponível ou aprovada no momento da conclusão da compra, sem prejuízo dos direitos previstos na legislação aplicável.

8. Envio da Arte

O cliente poderá enviar sua arte pelos meios disponibilizados na página do produto. O arquivo deverá estar íntegro, acessível e em condições adequadas para produção. Arquivos corrompidos, incompletos, protegidos por senha ou inacessíveis poderão impedir ou atrasar a produção.

9. Responsabilidade pela Arte

O cliente é responsável por conferir textos, ortografia, números, telefones, endereços, e-mails, redes sociais, QR Codes, logotipos, imagens, medidas, quantidade, posicionamento e demais informações presentes na arte.

Erros existentes no arquivo enviado pelo cliente não serão considerados falhas de produção da Maria Imprime, salvo quando houver erro comprovadamente causado pela empresa.

10. Aprovação da Arte

Quando o produto possuir etapa de aprovação, o cliente deverá conferir a arte antes da autorização para produção. A aprovação confirma que o cliente conferiu as informações apresentadas. Após a aprovação e o início da produção, alterações solicitadas pelo cliente poderão não ser tecnicamente possíveis.

Isso não afasta os direitos previstos na legislação aplicável nem a responsabilidade da Maria Imprime por eventual erro comprovadamente causado pela empresa.

11. Características da Impressão

A impressão digital e os processos de acabamento podem apresentar pequenas características naturais do processo produtivo, como variações de tonalidade, diferenças entre lotes, discretas diferenças de acabamento, variações de posicionamento ou marcas decorrentes da movimentação do material.

Quando essas características não comprometerem a utilização ou finalidade do produto, não serão consideradas defeitos de fabricação.

12. Tolerâncias Técnicas

A produção gráfica está sujeita às tolerâncias técnicas descritas na documentação específica da Maria Imprime. Poderão ocorrer pequenas variações de medidas, corte, acabamento, posicionamento e tonalidade.

Nos produtos de grandes formatos poderão ocorrer microrespingos, pequenas marcas superficiais ou variações de acabamento, desde que não comprometam a finalidade do produto. Características que atinjam de forma relevante rostos, textos, logotipos ou informações essenciais serão analisadas individualmente.

13. Variação de Cores

As cores visualizadas em telas podem apresentar diferenças em relação ao material impresso devido à configuração do monitor, brilho, contraste, iluminação, perfil de cores, material utilizado e tecnologia de impressão. Pequenas diferenças compatíveis com o processo gráfico não caracterizam, por si só, defeito de fabricação.

14. Produção

O prazo de produção será informado na página do produto ou durante o processo de compra. A contagem do prazo dependerá do cumprimento das condições necessárias para produção. Caso exista pendência relacionada ao pagamento, arquivo, aprovação ou informações do cliente, o pedido poderá permanecer aguardando regularização.

15. Alterações e Cancelamentos

Solicitações de alteração ou cancelamento deverão ser realizadas pelos canais oficiais da Maria Imprime. Quando o pedido ainda não tiver iniciado a produção, a solicitação será analisada conforme as condições da contratação e a legislação aplicável. Após o início da produção, alterações poderão não ser tecnicamente possíveis, especialmente quando o produto já tiver sido personalizado ou produzido sob encomenda.

Nada nesta cláusula deverá ser interpretado como renúncia a direitos assegurados ao consumidor pela legislação.

16. Entrega

As modalidades de entrega disponíveis serão apresentadas durante a compra. O cliente deverá fornecer corretamente nome, endereço, número, complemento, bairro, cidade, estado, CEP, telefone e outras informações necessárias.

O prazo de entrega exibido na compra é uma estimativa calculada pela transportadora para a modalidade selecionada e poderá variar conforme a operação de transporte. Ele é separado do prazo de produção do pedido.

Atrasos decorrentes de fatores externos ao controle razoável da Maria Imprime, como condições climáticas, greves, acidentes, restrições operacionais da transportadora ou atendimento de áreas de risco, não são de responsabilidade direta da loja. Ainda assim, a Maria Imprime prestará suporte ao cliente pelos canais oficiais para acompanhar a ocorrência e buscar as informações disponíveis junto ao transportador, sem prejuízo dos direitos assegurados pela legislação aplicável.

A Maria Imprime não será responsável por problemas de entrega decorrentes de informações incorretas fornecidas pelo cliente. Quando a entrega for realizada por terceiros, poderão existir situações de atraso ou intercorrência relacionadas ao serviço de transporte.

17. Garantia e Defeitos

A Maria Imprime é responsável pela conformidade dos produtos fornecidos, observadas as características, especificações e tolerâncias técnicas aplicáveis. Quando houver suspeita de defeito, o cliente deverá entrar em contato com a empresa e apresentar as informações necessárias para análise.

A solução será definida de acordo com a natureza do problema e a legislação aplicável, podendo envolver refabricação, reparo, substituição, abatimento ou restituição, quando cabível.

18. Direitos Autorais

O cliente declara possuir autorização para utilização dos conteúdos enviados para impressão, incluindo imagens, fotografias, logotipos, marcas, desenhos, ilustrações, textos, personagens e demais elementos protegidos. A Maria Imprime não se responsabiliza pela titularidade dos arquivos fornecidos pelo cliente.

19. Conteúdo Proibido

A Maria Imprime poderá recusar a produção de materiais cujo conteúdo seja ilícito ou cuja produção seja proibida pela legislação. Isso poderá incluir materiais falsificados, conteúdos que violem direitos de terceiros ou materiais cuja produção possa configurar infração legal.

20. Privacidade

Os dados pessoais serão tratados conforme a Política de Privacidade da Maria Imprime e a legislação aplicável.

21. Alterações dos Termos

A Maria Imprime poderá atualizar estes Termos sempre que necessário. A versão vigente estará disponível na Central de Documentação. Alterações futuras não deverão modificar retroativamente as condições registradas em pedidos anteriores.

22. Legislação

Estes Termos são regidos pelas leis brasileiras. Eventuais conflitos serão inicialmente tratados pelos canais oficiais de atendimento da Maria Imprime, sem prejuízo dos direitos assegurados ao consumidor pela legislação aplicável.

23. Disposições Finais

Ao concluir a compra, o cliente declara que teve acesso aos documentos disponibilizados, compreendeu as condições aplicáveis e concorda com os termos da contratação.`;

export const ART_APPROVAL_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Objetivo

Este Termo estabelece as condições relacionadas à conferência e aprovação das artes destinadas à produção pela Maria Imprime.

2. Responsabilidade pela Conferência

Antes de aprovar a arte, o cliente deverá conferir cuidadosamente todas as informações apresentadas.

A conferência deverá incluir textos, ortografia, números, telefones, endereços, e-mails, redes sociais, QR Codes, logotipos, imagens, cores, medidas, quantidade, posicionamento dos elementos, informações comerciais e demais elementos da arte.

3. Aprovação

A aprovação da arte significa que o cliente autorizou a produção daquela versão. Após a aprovação, a arte poderá ser encaminhada para produção.

4. Alterações Após Aprovação

Após a aprovação, qualquer solicitação de alteração deverá ser comunicada imediatamente à Maria Imprime. Se a produção ainda não tiver começado, a empresa poderá avaliar a possibilidade de alteração. Se a produção já tiver iniciado, a alteração poderá não ser tecnicamente possível.

Caso seja possível realizar uma alteração que gere custos adicionais, o cliente será informado previamente.

5. Erros da Arte

Erros presentes no arquivo enviado ou aprovados pelo cliente não serão considerados erros de produção da Maria Imprime. Entretanto, caso seja identificado erro comprovadamente causado pela Maria Imprime durante a produção, o caso será analisado e solucionado conforme a legislação aplicável.

6. Ausência de Aprovação

Quando o produto exigir aprovação e o cliente não realizar a aprovação dentro do prazo necessário para produção, o início da produção poderá ser adiado. O prazo de produção poderá ser impactado pela demora na aprovação.

7. Arquivos de Baixa Qualidade

A aprovação da arte não transforma um arquivo de baixa qualidade em um arquivo de alta qualidade. Caso o cliente forneça imagem de baixa resolução, imagem pixelizada ou arquivo inadequado, a qualidade final da impressão poderá ser afetada.

8. Aprovação Eletrônica

A aprovação poderá ocorrer por meio do sistema do site, e-mail, WhatsApp ou outro canal oficial utilizado pela Maria Imprime. A aprovação registrada ficará vinculada ao pedido correspondente.

9. Disposição Final

Ao aprovar a arte, o cliente confirma que teve oportunidade de conferir as informações apresentadas e autoriza a produção daquela versão, sem prejuízo dos direitos assegurados pela legislação aplicável.`;

export const PRODUCTION_DEADLINE_CONTENT = `POLÍTICA DE PRODUÇÃO E PRAZOS

MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Objetivo

Esta Política explica como funcionam os prazos de produção dos pedidos realizados na Maria Imprime.

2. Início da Produção

A produção poderá ser iniciada após o cumprimento das condições necessárias ao pedido.

Dependendo do produto, isso poderá incluir confirmação do pagamento, envio da arte, arquivo adequado, aprovação da arte, confirmação das especificações e demais informações necessárias.

3. Prazo de Produção

O prazo de produção será informado na página do produto ou durante o processo de compra. Salvo indicação diferente, o prazo de produção será contado em dias úteis.

O prazo exibido no configurador do produto no momento da contratação é a referência aplicável ao pedido, pois ele é definido individualmente na configuração do produto. Quando um produto não possuir prazo ativo configurado, a Maria Imprime não deverá declarar um prazo padrão genérico e a confirmação deverá ocorrer pelos canais oficiais antes da contratação.

4. Prazo de Produção Não é Prazo de Entrega

O prazo de produção corresponde ao período necessário para fabricação do produto. O prazo de transporte é separado e depende da modalidade de entrega escolhida.

Portanto: Prazo total estimado = produção + transporte.

5. Pendências do Cliente

Quando houver pendência que dependa do cliente, como arquivo, aprovação, informação incorreta, confirmação ou pagamento, o pedido poderá permanecer aguardando até que a pendência seja solucionada.

6. Alteração do Pedido

Alterações realizadas após a confirmação do pedido poderão impactar o prazo de produção. Caso a alteração exija nova preparação, novo arquivo ou nova produção, o novo prazo será informado ao cliente.

7. Grande Volume

Pedidos com grande quantidade ou projetos especiais poderão possuir prazo de produção diferente do prazo padrão apresentado no site. Quando necessário, o prazo será informado ao cliente antes da confirmação da contratação.

8. Produção em Grandes Formatos

Produtos como lonas, banners, outdoors, adesivos, placas, backdrops, painéis e fachadas podem depender de etapas adicionais de impressão e acabamento. Por isso, o prazo poderá variar conforme o produto, quantidade e acabamento escolhido.

9. Finais de Semana e Feriados

Salvo indicação expressa diferente, os prazos de produção são contabilizados em dias úteis. Sábados, domingos e feriados não serão considerados dias úteis para contagem do prazo de produção.

10. Situações Excepcionais

Situações fora do controle razoável da Maria Imprime poderão afetar os prazos, incluindo problemas técnicos, indisponibilidade excepcional de matéria-prima, falhas de fornecedores, interrupções de energia, eventos climáticos, acidentes, greves ou outros eventos de força maior.

11. Entrega

Após a conclusão da produção, o pedido será disponibilizado para retirada ou encaminhado conforme a modalidade de entrega escolhida. O prazo de transporte deverá ser considerado separadamente.

O prazo de entrega informado na compra é uma estimativa calculada pela transportadora e pode ser afetado por fatores externos, como condições climáticas, greves, acidentes, restrições operacionais ou áreas de risco. Nessas situações, a Maria Imprime não responde diretamente pelo atraso do transporte, mas prestará suporte ao cliente pelos canais oficiais para acompanhar a ocorrência junto ao transportador, observados os direitos previstos na legislação aplicável.

12. Consulta do Pedido

O cliente poderá consultar o status do pedido pelos recursos disponibilizados pela Maria Imprime.

13. Disposição Final

Os prazos apresentados durante a compra fazem parte das informações da contratação e deverão ser observados conforme as condições informadas ao cliente.`;

export const RETURNS_CANCELLATIONS_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Objetivo

Esta Política estabelece os procedimentos para solicitações relacionadas a cancelamentos, trocas, defeitos e reembolsos.

2. Produtos Personalizados

Grande parte dos produtos comercializados pela Maria Imprime é produzida sob encomenda e personalizada conforme as especificações fornecidas pelo cliente.

Por isso, uma solicitação feita após o início da produção poderá envolver materiais, tinta, acabamento e mão de obra já utilizados. Isso será considerado na análise do pedido, sempre respeitando os direitos previstos na legislação aplicável.

3. Cancelamento Antes da Produção

Quando o cliente solicitar cancelamento antes do início da produção, a Maria Imprime analisará a solicitação conforme o estágio do pedido e as regras legais aplicáveis.

4. Cancelamento Após Início da Produção

Quando a produção já tiver iniciado, o pedido poderá já possuir materiais e etapas produtivas realizadas.

Nesse caso, a possibilidade de cancelamento será analisada individualmente, considerando estágio da produção, personalização do produto, materiais já utilizados, serviços já executados e legislação aplicável.

5. Direito de Arrependimento

Nas situações em que a legislação assegure ao consumidor o direito de arrependimento, a Maria Imprime respeitará o prazo e as condições legalmente aplicáveis. O direito de arrependimento nas compras realizadas fora do estabelecimento comercial é previsto pelo Código de Defesa do Consumidor.

6. Produto com Defeito

Caso o cliente identifique possível defeito de fabricação, deverá entrar em contato com a Maria Imprime pelos canais oficiais.

Sempre que possível, deverão ser enviados número do pedido, fotografias, vídeos quando necessários, descrição do problema e informações solicitadas pela equipe de atendimento.

7. Análise Técnica

A Maria Imprime poderá solicitar informações e imagens para verificar se o problema decorre do processo de produção, do arquivo enviado, do transporte, da instalação, do armazenamento, do uso ou de características naturais do processo gráfico.

8. Grandes Formatos

Em materiais de grandes formatos podem existir pequenas características inerentes ao processo de impressão, como pequenos respingos, pequenas marcas superficiais, pequenas variações de tonalidade e pequenas diferenças de acabamento.

Quando essas características não comprometerem a finalidade do produto, não serão consideradas defeitos. Por outro lado, uma falha que comprometa significativamente um elemento essencial da arte — como um rosto, texto principal, logotipo ou informação essencial — será analisada individualmente.

9. Refabricação

Quando for constatado defeito de fabricação atribuível à Maria Imprime, a empresa poderá realizar a refabricação ou adotar outra solução cabível conforme a legislação aplicável.

10. Reembolso

Quando houver direito ao reembolso, o procedimento será realizado conforme a forma de pagamento utilizada e os prazos aplicáveis.

11. Erros do Cliente

Erros existentes na arte fornecida ou aprovada pelo cliente não serão considerados defeitos de fabricação. Exemplos incluem telefone errado, endereço errado, texto errado, imagem incorreta, logotipo incorreto, medida informada incorretamente e arquivo de baixa resolução.

12. Mau Uso ou Instalação

A garantia relacionada a defeitos de fabricação não abrange danos provocados por instalação inadequada, armazenamento inadequado, exposição inadequada, utilização diferente da finalidade do produto, alterações realizadas por terceiros, acidentes ou mau uso.

13. Prazo para Comunicação

O cliente deverá comunicar qualquer problema assim que identificá-lo, pelos canais oficiais da Maria Imprime, para permitir a análise e eventual solução.

14. Disposição Final

Cada solicitação será analisada individualmente, observando-se as características do pedido, as evidências apresentadas e a legislação aplicável.`;

export const PRIVACY_POLICY_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Apresentação

A Maria Imprime valoriza a privacidade e a proteção dos dados pessoais de seus clientes e usuários.

Esta Política explica como os dados pessoais podem ser coletados, utilizados, armazenados e protegidos durante a utilização do site e dos serviços da Maria Imprime.

2. Quem Somos

Maria Imprime – Sua Gráfica Online

Razão social: Carlos Eduardo Barreto Novaes Pinheiro - ME

CNPJ: 34.528.399/0001-08

Endereço: Avenida Antonio Ferreira dos Santos, 651, Braga, Cabo Frio/RJ, CEP 28908-200

E-mail de contato: contatomariaimprime@gmail.com

E-mail para assuntos de privacidade: contatomariaimprime@gmail.com

2.1. Papéis no tratamento de dados pessoais

A Maria Imprime atua como controladora dos dados pessoais tratados para viabilizar o relacionamento com clientes, pedidos, pagamentos, produção, entrega e atendimento.

Prestadores de serviços contratados para apoiar a operação poderão atuar como operadores quando tratarem dados pessoais em nome da Maria Imprime e conforme suas instruções, ou como controladores independentes quando a legislação e sua própria operação assim determinarem.

O canal de contato para solicitações de titulares e comunicações sobre privacidade é contatomariaimprime@gmail.com. Caso seja formalmente designado encarregado de dados, sua identificação e canal serão publicados nesta Política.

3. Dados que Podemos Coletar

Dependendo da utilização do site, poderão ser coletados dados de cadastro (nome, CPF ou CNPJ, e-mail, telefone e senha, quando aplicável); dados de entrega (CEP, endereço, número, complemento, bairro, cidade e estado); dados de compra (produtos adquiridos, quantidades, valores, pedidos, histórico de compras, forma de pagamento e informações necessárias para processamento da transação); dados técnicos (endereço IP, navegador, dispositivo, sistema operacional, informações de acesso e registros de segurança).

Arquivos enviados: quando o cliente enviar uma arte, o arquivo poderá ser armazenado para possibilitar a produção e o atendimento do pedido.

4. Finalidades do Tratamento

Os dados poderão ser utilizados para criar e administrar contas, processar pedidos e pagamentos, produzir pedidos, realizar entregas, emitir documentos fiscais, entrar em contato com o cliente, prestar atendimento, acompanhar pedidos, prevenir fraudes, manter a segurança do site, cumprir obrigações legais e melhorar os serviços.

5. Bases Legais

O tratamento de dados poderá ocorrer conforme as bases legais previstas na legislação aplicável, incluindo, quando cabível: execução de contrato; cumprimento de obrigação legal ou regulatória; exercício regular de direitos; legítimo interesse; e consentimento, quando necessário.

6. Compartilhamento

Os dados poderão ser compartilhados quando necessário com prestadores envolvidos na operação do serviço, como meios de pagamento, transportadoras, fornecedores de tecnologia, serviços de hospedagem, serviços de comunicação, sistemas de segurança, contabilidade e autoridades públicas, quando houver obrigação legal.

A Maria Imprime não deverá comercializar dados pessoais de seus clientes de forma incompatível com a legislação aplicável.

7. Pagamentos

Os pagamentos poderão ser processados por empresas especializadas. A Maria Imprime poderá não armazenar diretamente determinados dados sensíveis de pagamento, como números completos de cartão, quando o processamento for realizado por terceiros especializados.

8. Segurança

A Maria Imprime adotará medidas técnicas e administrativas razoáveis para proteger os dados pessoais contra acessos não autorizados, perda, alteração, destruição ou tratamento inadequado.

9. Retenção

Os dados serão mantidos pelo período necessário para cumprir as finalidades para as quais foram coletados e as obrigações legais aplicáveis. Alguns dados poderão precisar ser mantidos mesmo após o encerramento da conta ou pedido quando houver obrigação legal ou necessidade de preservação para exercício regular de direitos.

10. Direitos do Titular

Nos termos da legislação aplicável, o titular poderá solicitar, conforme o caso, confirmação da existência de tratamento, acesso aos dados, correção, atualização, informações sobre compartilhamento, eliminação quando aplicável, revogação do consentimento quando essa for a base legal e demais direitos previstos na legislação.

A solicitação poderá ser realizada pelo canal de privacidade informado pela Maria Imprime.

11. Cookies

O site poderá utilizar cookies e tecnologias semelhantes. O funcionamento dessas tecnologias é explicado na Política de Cookies da Maria Imprime.

12. Menores de Idade

A Maria Imprime não tem como objetivo coletar intencionalmente dados de crianças ou adolescentes de forma incompatível com a legislação aplicável. Caso seja identificada coleta inadequada, serão adotadas medidas cabíveis.

13. Alterações da Política

Esta Política poderá ser atualizada para refletir mudanças legais, tecnológicas ou operacionais. A versão atual estará sempre disponível no site.

14. Contato

Para dúvidas ou solicitações relacionadas à privacidade:

E-mail: contatomariaimprime@gmail.com

Maria Imprime – Sua Gráfica Online`;

export const COOKIES_POLICY_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. O que são Cookies?

Cookies são pequenos arquivos ou tecnologias semelhantes armazenados no dispositivo do usuário durante a utilização de um site.

Eles podem permitir o funcionamento de recursos, lembrar preferências, manter sessões, armazenar itens do carrinho e coletar informações sobre a utilização do site.

2. Por que utilizamos Cookies?

A Maria Imprime poderá utilizar cookies para funcionamento do site, manutenção do carrinho, autenticação, segurança, preferências, análise de desempenho, melhoria da experiência e outras finalidades informadas ao usuário.

3. Tipos de Cookies

Cookies Necessários

São utilizados para permitir o funcionamento básico do site, incluindo carrinho, login, sessão, segurança e funcionamento de recursos essenciais. A desativação desses cookies poderá prejudicar o funcionamento do site.

Cookies de Funcionalidade

Podem lembrar determinadas preferências e configurações do usuário.

Cookies Analíticos

Podem ser utilizados para compreender como os usuários utilizam o site e identificar oportunidades de melhoria.

Cookies de Publicidade

Quando utilizados, poderão auxiliar na apresentação e medição de publicidade ou conteúdos personalizados.

4. Cookies Próprios e de Terceiros

Cookies próprios são definidos diretamente pela Maria Imprime. Cookies de terceiros poderão ser definidos por serviços externos utilizados pelo site.

5. Controle de Cookies

Quando aplicável, o site poderá disponibilizar mecanismos para que o usuário gerencie cookies não necessários. O usuário poderá também configurar seu navegador para bloquear ou excluir determinados cookies.

6. Cookies Necessários

Alguns cookies são necessários para que funcionalidades essenciais, como carrinho, autenticação e segurança, funcionem corretamente.

Nesta revisão técnica foram identificados cookies funcionais de sessão e operação do site: "app_session_id" (sessão da aplicação), "customer_session" (sessão do cliente), "cart_session" (carrinho) e "admin_session" (sessão administrativa). Eles não são usados para publicidade.

7. Cookies Não Necessários

Cookies não necessários deverão ser tratados de acordo com as opções e mecanismos de consentimento disponibilizados pelo site, quando aplicável.

8. Alterações

Esta Política poderá ser atualizada para refletir alterações nas tecnologias utilizadas, nos serviços ou na legislação.

9. Transparência

A Maria Imprime buscará manter informações claras sobre as finalidades dos cookies utilizados. Esta política não declara individualmente ferramentas analíticas, pixels de publicidade ou serviços de terceiros enquanto não houver confirmação técnica de sua utilização no site.

10. Contato

Dúvidas relacionadas aos cookies poderão ser encaminhadas para:

E-mail: contatomariaimprime@gmail.com

Maria Imprime – Sua Gráfica Online`;

export const SITE_USE_TERMS_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Apresentação

Este Termo estabelece as regras para utilização do site da Maria Imprime.

Ao acessar ou utilizar o site, o usuário deverá respeitar as condições apresentadas neste documento e a legislação aplicável.

2. Utilização do Site

O site deverá ser utilizado exclusivamente para finalidades lícitas.

É proibido utilizar a plataforma para praticar atividades ilegais, tentar acessar áreas restritas, interferir no funcionamento do sistema, distribuir códigos maliciosos, realizar tentativas de fraude, utilizar informações de terceiros sem autorização ou explorar vulnerabilidades de segurança.

3. Cadastro

Quando houver necessidade de cadastro, o usuário deverá fornecer informações verdadeiras. O usuário é responsável pela segurança de suas credenciais de acesso.

4. Conta do Cliente

Quando disponível, a conta poderá permitir acompanhamento de pedidos, consulta de dados, acesso ao histórico, acompanhamento da produção e acesso a informações relacionadas às compras.

5. Pedidos

Os pedidos realizados pelo site estarão sujeitos às condições apresentadas durante a contratação e aos Termos e Condições de Venda.

6. Conteúdo Enviado pelo Usuário

O usuário poderá enviar arquivos para produção. Ao enviar um arquivo, declara possuir autorização para utilização do conteúdo. A Maria Imprime não adquire a propriedade do arquivo enviado pelo cliente.

7. Direitos Autorais

É responsabilidade do usuário garantir que os arquivos enviados não violem direitos de terceiros.

8. Propriedade Intelectual da Maria Imprime

Elementos próprios do site, incluindo marca, logotipo, textos, imagens, layout, elementos gráficos, sistemas e funcionalidades, não poderão ser reproduzidos ou utilizados indevidamente sem autorização.

9. Disponibilidade

A Maria Imprime buscará manter o site disponível, mas poderão ocorrer interrupções decorrentes de manutenção, atualizações, falhas técnicas, problemas de hospedagem, problemas de terceiros ou eventos externos.

10. Segurança

O usuário não deverá tentar comprometer a segurança da plataforma. Atividades suspeitas poderão ser bloqueadas e analisadas.

11. Informações dos Produtos

A Maria Imprime buscará disponibilizar informações corretas sobre seus produtos. Características técnicas, imagens ilustrativas, cores e demais informações deverão ser interpretadas de acordo com as especificações apresentadas na página do produto.

12. Links Externos

O site poderá apresentar links para serviços de terceiros. A Maria Imprime não controla integralmente o conteúdo, funcionamento ou políticas de sites externos.

13. Suspensão de Acesso

Quando houver utilização indevida ou violação das regras do site, a Maria Imprime poderá adotar medidas de segurança e limitar o acesso, observada a legislação aplicável.

14. Alterações do Site

A Maria Imprime poderá alterar, atualizar ou aprimorar funcionalidades do site.

15. Alterações deste Termo

Este Termo poderá ser atualizado sempre que necessário. A versão vigente ficará disponível no site.

16. Legislação

Este Termo será interpretado de acordo com a legislação brasileira, sem prejuízo dos direitos assegurados ao consumidor.

17. Contato

Para dúvidas relacionadas à utilização do site:

Maria Imprime – Sua Gráfica Online

E-mail: contatomariaimprime@gmail.com`;

export const FAQ_CONTENT = `MARIA IMPRIME – SUA GRÁFICA ONLINE

1. Como faço uma compra?

Escolha o produto, configure as opções disponíveis, informe a quantidade, envie ou disponibilize sua arte quando solicitado, escolha a forma de entrega, realize o pagamento e finalize o pedido.

2. Posso enviar minha própria arte?

Sim. Os produtos que permitem personalização possuem opções para envio da arte, como upload ou link, conforme disponibilizado na página do produto.

3. Quais formatos de arquivo posso enviar?

Os formatos aceitos serão informados na página de cada produto. Quando disponíveis, poderão incluir PDF, PNG, JPG, TIFF, AI e CDR.

4. Qual deve ser a resolução da minha arte?

Recomenda-se utilizar arquivos em boa resolução e preparados de acordo com o tamanho final do produto. A qualidade da arte enviada influencia diretamente o resultado da impressão.

5. A Maria Imprime corrige minha arte?

Quando o produto oferecer serviço específico de criação, ajuste ou conferência de arquivo, as condições serão informadas na página do produto. Não se deve presumir que todo arquivo enviado será corrigido ou redesenhado.

6. Posso cancelar meu pedido?

Solicitações de cancelamento serão analisadas conforme o estágio do pedido e a legislação aplicável. Produtos personalizados podem já estar em processo de produção, portanto o cliente deverá entrar em contato o quanto antes.

7. Posso cancelar depois que a produção começou?

Entre em contato imediatamente. A possibilidade de cancelamento será analisada considerando o estágio da produção, a personalização do produto e os direitos previstos na legislação aplicável.

8. Posso trocar um produto personalizado porque não gostei?

Se o produto estiver de acordo com o pedido e não apresentar defeito, a situação será analisada considerando as características da contratação e a legislação aplicável. Produtos personalizados possuem características diferentes de produtos padronizados, pois são produzidos conforme as especificações escolhidas pelo cliente.

9. E se o produto chegar com defeito?

Entre em contato com a Maria Imprime pelos canais oficiais e informe o número do pedido. Sempre que possível, envie fotos ou vídeos que mostrem o problema.

10. Pequenos respingos ou marcas na impressão são defeitos?

Em impressões de grandes formatos podem ocorrer pequenas características inerentes ao processo produtivo. Quando forem pequenas e não comprometerem a finalidade do produto, não serão consideradas defeitos.

11. E se houver uma mancha em um rosto ou em uma informação importante?

Uma característica que comprometa significativamente um elemento essencial da arte, como rosto, texto principal, logotipo ou informação importante, será analisada individualmente. Se for constatado defeito de produção, será adotada a solução cabível conforme a legislação aplicável.

12. As cores ficarão exatamente iguais às da tela?

Não necessariamente. Monitores, celulares e tablets utilizam diferentes configurações e tecnologias de exibição. Também existem diferenças entre os materiais e processos de impressão. Pequenas variações de tonalidade podem ocorrer.

13. Qual é o prazo de produção?

O prazo é informado na página de cada produto e pode variar de acordo com produto, quantidade, material, acabamento, necessidade de aprovação e outras condições do pedido.

14. O prazo de produção inclui o transporte?

Não. O prazo de produção corresponde à fabricação. O transporte possui prazo próprio de acordo com a modalidade de entrega escolhida. O prazo informado pela transportadora é uma estimativa e pode sofrer impacto de condições climáticas, greves, acidentes, restrições operacionais ou áreas de risco. A Maria Imprime oferece suporte para acompanhamento dessas ocorrências pelos canais oficiais.

15. Posso retirar meu pedido?

Quando a opção estiver disponível, o cliente poderá escolher a retirada durante o processo de compra.

16. A Maria Imprime entrega em todo o Brasil?

As regiões atendidas dependerão das modalidades de entrega disponíveis para cada pedido. As opções serão apresentadas durante a compra.

17. Posso acompanhar meu pedido?

Quando o recurso estiver disponível, o cliente poderá acompanhar o status do pedido pelo sistema da Maria Imprime.

18. O que acontece se eu enviar a arte errada?

Entre em contato imediatamente. Se a produção ainda não tiver começado, poderá existir possibilidade de substituição do arquivo. Depois do início da produção, a substituição poderá não ser tecnicamente possível.

19. O que acontece se eu aprovar uma arte com erro?

A aprovação significa que o cliente autorizou aquela versão para produção. Por isso, é muito importante conferir cuidadosamente todos os elementos antes da aprovação.

20. Posso usar imagens encontradas na internet?

Somente quando possuir autorização ou licença adequada para utilização. O cliente é responsável pelos direitos relacionados ao conteúdo enviado.

21. Meus dados pessoais estão protegidos?

A Maria Imprime adota medidas para proteger os dados pessoais e trata as informações conforme sua Política de Privacidade e a legislação aplicável.

22. O site utiliza cookies?

O site poderá utilizar cookies necessários para funcionamento, segurança, carrinho, autenticação e outras funcionalidades, além de outros cookies conforme as configurações do site. Consulte a Política de Cookies para obter mais informações.

23. Como entro em contato com a Maria Imprime?

Utilize os canais oficiais de atendimento disponibilizados no site.

24. Onde posso consultar os termos da compra?

Todos os documentos estão disponíveis na Central de Documentação da Maria Imprime. Durante a compra, o cliente também poderá clicar em “Ler” ao lado de “Aceito os termos e condições”.

25. Preciso aceitar vários termos diferentes?

Não. O processo de compra deverá apresentar um único aceite: “Aceito os termos e condições”. O link “Ler” permite consultar todos os documentos antes da conclusão da compra.`;

const CHECKOUT_DOCUMENTS = [
  { id: "termos-venda", title: "Termos e Condições de Venda", content: TERMS_OF_SALE_CONTENT },
  { id: "aprovacao-arte", title: "Termo de Aprovação de Arte", content: ART_APPROVAL_CONTENT },
  { id: "producao-prazos", title: "Política de Produção e Prazos", content: PRODUCTION_DEADLINE_CONTENT },
  { id: "trocas-reembolsos", title: "Política de Trocas, Cancelamentos e Reembolsos", content: RETURNS_CANCELLATIONS_CONTENT },
  { id: "privacidade-lgpd", title: "Política de Privacidade (LGPD)", content: PRIVACY_POLICY_CONTENT },
  { id: "cookies", title: "Política de Cookies", content: COOKIES_POLICY_CONTENT },
  { id: "uso-site", title: "Termo de Uso do Site", content: SITE_USE_TERMS_CONTENT },
  { id: "faq", title: "Perguntas Frequentes (FAQ)", content: FAQ_CONTENT },
];

export const PUBLIC_DOCUMENTS = [
  ...CHECKOUT_DOCUMENTS,
  {
    id: "formas-pagamento",
    title: "Formas de Pagamento",
    content: `FORMAS DE PAGAMENTO

As formas de pagamento, bandeiras, parcelamentos, limites e demais condições exibidos no checkout dependem da disponibilidade e das regras do processador de pagamentos homologado, bem como das análises e autorizações realizadas por ele e, quando aplicável, pela instituição financeira do cliente.

A Maria Imprime poderá disponibilizar, restringir ou substituir modalidades de pagamento conforme essa disponibilidade, apresentando no checkout as opções efetivamente habilitadas para cada pedido. O cliente não deverá considerar como garantida uma modalidade que não esteja disponível ou aprovada no momento da conclusão da compra, sem prejuízo dos direitos previstos na legislação aplicável.`,
  },
  {
    id: "entrega-retirada",
    title: "Entrega e Retirada",
    content: `ENTREGA E RETIRADA

As modalidades de entrega disponíveis serão apresentadas durante a compra. O cliente deverá fornecer corretamente nome, endereço, número, complemento, bairro, cidade, estado, CEP, telefone e outras informações necessárias.

O prazo de entrega exibido na compra é uma estimativa calculada pela transportadora para a modalidade selecionada e poderá variar conforme a operação de transporte. Ele é separado do prazo de produção do pedido.

Quando houver opção de retirada, as instruções aplicáveis serão apresentadas no pedido após a confirmação das condições necessárias para produção e disponibilização.`,
  },
];

export const TERMS_VERSION = "2026-08-12-v2";

export function TermsAcceptance({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  const requestedDocumentId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("document");
  const requestedDocument = CHECKOUT_DOCUMENTS.find((document) => document.id === requestedDocumentId);
  const [documentationOpen, setDocumentationOpen] = useState(Boolean(requestedDocument));

  return <div id="terms" className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm">
    <div className="flex items-center gap-2">
      <Checkbox id="terms-checkbox" checked={checked} onCheckedChange={value => onCheckedChange(value === true)} />
      <Label htmlFor="terms-checkbox" className="text-sm cursor-pointer text-gray-700">Aceito os termos e condições</Label>
      <Dialog open={documentationOpen} onOpenChange={setDocumentationOpen}><DialogTrigger asChild><button type="button" className="text-sm font-semibold text-pink-600 hover:text-pink-700 underline underline-offset-2">Ler</button></DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>DOCUMENTAÇÃO DA MARIA IMPRIME</DialogTitle><DialogDescription>Para sua segurança e transparência, disponibilizamos os documentos que regulamentam compras, produção, impressão, arquivos, prazos, trocas, privacidade e utilização do site.</DialogDescription></DialogHeader>
          <Accordion type="single" collapsible defaultValue={requestedDocument ? `document-${requestedDocument.id}` : undefined} className="w-full">{CHECKOUT_DOCUMENTS.map((document) => <AccordionItem key={document.id} value={`document-${document.id}`}><AccordionTrigger>{document.title}</AccordionTrigger><AccordionContent><p className="whitespace-pre-line text-sm leading-6 text-gray-600">{document.content}</p></AccordionContent></AccordionItem>)}</Accordion>
        </DialogContent>
      </Dialog>
    </div>
  </div>;
}
