// Full detailed prompts for the "Popular Brasileiro" virtual staging style.
// These prompts already include the Gemini image-output directive as the first line
// and must NOT be wrapped with adaptExistingPrompt().

export const POPULAR_BRASILEIRO_PROMPTS = {
  living_room: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished living room in the Brazilian popular-market style. OUTPUT: Photorealistic furnished living room photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente a sala de estar vazia ou semi-vazia da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — SALA DE ESTAR POPULAR:

1. SOFA RETRATIL: Posicione um sofa retratil grande em formato L ou reto, estofado em tecido suede sintetico na cor marrom, caramelo ou bege escuro. O encosto deve ter costura em capitone (tufted). Braccos largos e quadrados. O modulo retratil ou chaise deve ser posicionado de acordo com o layout da sala.

2. TAPETE: Tapete retangular de pelo baixo nas cores cinza claro ou off-white, centralizado sob o conjunto de sofa.

3. MESA DE CENTRO: Mesa de centro retangular em MDF/aglomerado branco ou off-white, acabamento padrao de mercado popular (sem laqueado, sem high-gloss). Modelo simples com prateleira inferior ou base fechada. Posicionada a frente do sofa.

4. RACK / PAINEL DE TV: Rack ou buffet em MDF/aglomerado branco, padrao mercado popular — portas retas lisas, gavetas pequenas, puxadores barra cromados simples. Televisor de tela plana posicionado sobre o rack ou fixado na parede acima dele.

5. LUMINARIA DE CHAO (opcional): Luminaria de chao simples em metal ou plastico com cupula branca basica, posicionada ao lado do sofa.

6. PLANTA (opcional): Uma planta media em vaso plastico simples ou ceramica basica, posicionada em um canto da sala.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, armarios embutidos ou qualquer elemento fixo do imovel.
2. NAO ADICIONE PAINEIS OU REVESTIMENTOS: Nao insira paineis de parede amadeirados, papel de parede, gesso, molduras ou qualquer revestimento decorativo nas paredes. As paredes devem permanecer exatamente como estao na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de materiais ou pisos originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original.
5. PADRAO POPULAR OBRIGATORIO: Todos os moveis de madeira devem ser em MDF/aglomerado com acabamento padrao de mercado popular — sem laqueado, sem high-gloss, sem materiais nobres. Sem referencias a marcas de design ou produtos premium.

Resultado esperado: Uma fotografia imobiliaria profissional da sala de estar mobiliada com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  bedroom: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished bedroom in the Brazilian popular-market style. OUTPUT: Photorealistic furnished bedroom photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente o quarto vazio ou semi-vazio da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — QUARTO POPULAR:

1. GUARDA-ROUPA: Posicione um guarda-roupa grande em MDF/aglomerado branco, acabamento padrao de mercado popular (sem laqueado, sem high-gloss, sem estrutura amadeirada). Escolha a opcao que melhor se adapta ao espaco disponivel na parede principal:
   - Opcao A — Guarda-roupa de correr: 3 a 4 portas de correr em MDF branco liso com frisos horizontais simples, com ou sem modulos aereos superiores. Puxadores barra cromados.
   - Opcao B — Guarda-roupa com gavetas e portas: modulo com 5 gavetas empilhadas de um lado e modulo de 2 portas do outro, tudo em MDF branco padrao. Puxadores barra cromados. TV pode ser posicionada sobre o modulo de gavetas.
   - Opcao C — Conjunto compacto: guarda-roupa 2 portas em MDF branco ou preto padrao + comoda 4 gavetas combinando, ambos com puxadores barra cromados simples.
   Posicionar rente a parede principal.

2. CAMA: Cama de casal ou queen size. Base box estofada em tecido cinza escuro ou carvao, padrao basico. Cabeceira estofada simples em cinza escuro ou integrada ao guarda-roupa. Roupa de cama: lencol branco ou bege claro, edredom cinza ou taupe, dois travesseiros simples.

3. CRIADO-MUDO (opcional, se houver espaco): Criado-mudo pequeno em MDF branco com uma gaveta, modelo basico de mercado popular. Abajur simples sobre o criado-mudo.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, armarios embutidos ou qualquer elemento fixo do imovel.
2. NAO ADICIONE PAINEIS OU REVESTIMENTOS: Nao insira paineis de parede amadeirados, papel de parede, gesso ou qualquer revestimento decorativo. As paredes devem permanecer exatamente como estao na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de materiais ou pisos originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original.
5. PADRAO POPULAR OBRIGATORIO: Todos os moveis devem ser em MDF/aglomerado com acabamento padrao de mercado popular — sem laqueado, sem high-gloss, sem estrutura em madeira macica ou freijo. Sem referencias a marcas de design ou produtos premium.

Resultado esperado: Uma fotografia imobiliaria profissional do quarto mobiliado com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  bathroom: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished bathroom in the Brazilian popular-market style. OUTPUT: Photorealistic furnished bathroom photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente o banheiro vazio ou semi-vazio da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — BANHEIRO POPULAR:

1. GABINETE: Gabinete compacto em MDF/aglomerado branco, acabamento padrao de mercado popular (sem laqueado, sem high-gloss). Configuracao: 2 portas retas lisas + 1 gaveta central ou superior. Puxadores barra cromados simples, um por porta. Base com pes curtos aparentes ou rodape simples. Largura proporcional ao ambiente (tipicamente 60 a 80cm).

2. TAMPO E CUBA: Tampo em formica branca ou ceramica branca simples. Cuba de apoio em louca branca (redonda ou retangular) posicionada SOBRE o tampo — nao embutida. Modelo basico de mercado popular.

3. TORNEIRA: Torneira monocomando cromada, modelo basico padrao, fixada sobre a cuba ou no tampo.

4. ESPELHO: Espelho retangular simples sem moldura OU espelho com moldura em MDF branco com pequena prateleira inferior. Tamanho padrao (50x70cm ou similar). Sem cantos arredondados, sem moldura decorativa.

5. VASO SANITARIO: Vaso sanitario branco com caixa acoplada padrao, modelo basico. Posicionado na parede de instalacao hidraulica.

6. PAREDES (se estiverem sem revestimento): Azulejo branco 20x20cm cobrindo a area molhada ate ~1,5m de altura. Restante da parede em tinta branca ou bege muito claro.

7. ACESSORIOS: Dispenser de sabonete plastico ou ceramica branca sobre o gabinete. Uma toalha branca dobrada em suporte de toalha cromado simples fixado na parede. Sem velas, sem difusores, sem plantas.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas ou qualquer elemento fixo do imovel.
2. NAO MUDE PISOS OU REVESTIMENTOS: Nao substitua pisos ou revestimentos ja existentes na foto original.
3. NAO ADICIONE PAINEIS OU DECORACAO DE PAREDE: Nao insira paineis amadeirados, pastilhas decorativas, papel de parede ou qualquer revestimento que nao esteja na foto original.
4. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas ou texturas de materiais originais.
5. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original.
6. PADRAO POPULAR OBRIGATORIO: Gabinete em MDF/aglomerado branco padrao — sem laqueado, sem high-gloss, sem materiais nobres. Hardware exclusivamente em cromado basico. Sem bancadas em granito, marmore ou granilite.

Resultado esperado: Uma fotografia imobiliaria profissional do banheiro mobiliado com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  dining_room: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished dining room in the Brazilian popular-market style. OUTPUT: Photorealistic furnished dining room photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente a sala de jantar vazia ou semi-vazia da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — SALA DE JANTAR POPULAR:

1. CONJUNTO DE JANTAR: Mesa de jantar retangular com tampo de vidro temperado de 8mm sobre base em MDF/aglomerado branco ou preto padrao. Quatro a seis cadeiras estofadas em tecido suede sintetico cinza escuro ou preto, com estrutura em MDF/aglomerado combinando com a mesa. Puxadores ou pes cromados simples.

2. BUFFET OU CRISTALEIRA (opcional): Buffet baixo em MDF/aglomerado branco com 4 portas retas e puxadores barra cromados, ou cristaleira padrao com prateleiras de vidro e portas, ambos no padrao de mercado popular.

3. LUMINARIA (opcional): Pendente simples sobre a mesa, modelo basico cromado ou branco com cupula de plastico ou tecido simples.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas ou qualquer elemento fixo.
2. NAO ADICIONE PAINEIS OU REVESTIMENTOS: As paredes devem permanecer exatamente como estao na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas ou pisos originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz da fotografia original.
5. PADRAO POPULAR OBRIGATORIO: Todos os moveis em MDF/aglomerado padrao popular — sem laqueado, sem high-gloss, sem materiais nobres.

Resultado esperado: Uma fotografia imobiliaria profissional da sala de jantar mobiliada com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real.`,

  office: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished home office in the Brazilian popular-market style. OUTPUT: Photorealistic furnished office photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente o escritorio vazio ou semi-vazio da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — ESCRITORIO POPULAR:

1. ESCRIVANINHA: Mesa de escritorio retangular em MDF/aglomerado branco ou preto padrao, acabamento de mercado popular (sem laqueado, sem high-gloss). Modelo simples com tampo reto, opcionalmente com uma gaveta lateral ou gaveteiro pedestal separado em MDF branco combinando. Puxadores barra cromados simples.

2. CADEIRA DE ESCRITORIO: Cadeira giratoria executiva com encosto alto, estofado em tecido ou courino preto, base em plastico preto ou metal cromado, com rodizios. Modelo basico com regulagem de altura.

3. ESTANTE OU ARMARIO (opcional, se houver espaco): Estante simples em MDF/aglomerado branco com 3 a 5 prateleiras abertas, com livros organizados e um ou dois objetos decorativos basicos. OU armario alto em MDF branco com 2 portas retas e puxadores barra cromados.

4. MONITOR E ACESSORIOS: Monitor de computador sobre a mesa (tela plana, modelo basico). Teclado e mouse sobre o tampo. Nao sobrecarregar a cena com muitos objetos.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, armarios embutidos ou qualquer elemento fixo do imovel.
2. NAO ADICIONE PAINEIS OU REVESTIMENTOS: As paredes devem permanecer exatamente como estao na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de materiais ou pisos originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original.
5. PADRAO POPULAR OBRIGATORIO: Todos os moveis em MDF/aglomerado padrao popular — sem laqueado, sem high-gloss, sem materiais nobres ou marcas de design.

Resultado esperado: Uma fotografia imobiliaria profissional do escritorio mobiliado com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  office_moderno: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished home office in the Brazilian contemporary modern style. OUTPUT: Photorealistic furnished office photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario contemporaneo brasileiro de medio-alto padrao. Sua tarefa e mobiliar digitalmente o escritorio vazio ou semi-vazio da imagem fornecida com moveis de padrao moderno brasileiro, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — ESCRITORIO MODERNO BRASILEIRO:

1. MESA DE TRABALHO: Mesa de escritorio ampla com tampo em MDF laca branca ou em laminado amadeirado (freijo ou carvalho claro), espessura de 3 a 4cm aparente, com pes ou base em metal preto fosco ou aco escovado. Modelo clean sem gavetas embutidas no tampo — gaveteiro pedestal separado sob ou ao lado da mesa.

2. GAVETEIRO PEDESTAL: Gaveteiro com 3 a 4 gavetas em MDF laca branca ou cinza claro, com puxadores slim em metal escovado ou embutidos. Sobre rodizios para mobilidade.

3. CADEIRA DE ESCRITORIO: Cadeira ergonomica com encosto alto em malha ou tecido cinza escuro/preto, assento estofado, base em metal cromado ou aluminio polido, com rodizios. Design contemporaneo e slim — sem estofado excessivamente volumoso.

4. ESTANTE PLANEJADA (se houver parede disponivel): Estante planejada em MDF com combinacao de nichos abertos e modulos fechados com portas de abrir em laca branca ou cinza, puxadores slim em metal escovado. Altura ate o teto. Nichos abertos com livros organizados por cor, pequenos vasos e objetos decorativos.

5. MONITOR E SETUP: Monitor de tela plana sobre a mesa (um ou dois monitores). Teclado slim e mouse wireless. Suporte de monitor em metal ou bras articulado. Caixa de cabo organizadora discreta sob a mesa.

6. ILUMINACAO: Luminaria de mesa articulada com base ou garra, em metal preto fosco ou dourado, posicionada em um canto do tampo. Opcional: pendente suspenso sobre a mesa de trabalho com haste em metal e cupula minimalista.

7. ACESSORIOS DECORATIVOS: Uma planta pequena em vaso de ceramica branca ou cimento sobre a mesa ou estante. Quadro abstrato na parede atras da mesa. Porta-canetas e porta-objetos em metal ou concreto. Livros organizados.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, spots embutidos, gesso ou qualquer elemento fixo do imovel.
2. NAO ADICIONE REVESTIMENTOS: Nao insira paineis de parede, papel de parede ou qualquer acabamento que nao esteja na foto original. As paredes devem permanecer exatamente como estao.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de pisos ou materiais originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. Nao adicione nem remova fontes de luz estruturais.
5. PADRAO MODERNO OBRIGATORIO: Moveis com linhas limpas e contemporaneas. MDF em laca branca ou cinza combinado com detalhes amadeirados e metal preto fosco ou escovado. Sem moveis rusticos, sem MDF aglomerado padrao popular, sem dourado exagerado. Estetica de home office planejado de apartamento decorado de incorporadora brasileira de medio-alto padrao.

Resultado esperado: Uma fotografia imobiliaria profissional do escritorio mobiliado no estilo moderno brasileiro contemporaneo, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  kitchen: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished kitchen in the Brazilian popular-market style. OUTPUT: Photorealistic furnished kitchen photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario popular brasileiro. Sua tarefa e mobiliar digitalmente a cozinha vazia ou semi-vazia da imagem fornecida com moveis de padrao popular, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — COZINHA POPULAR:

1. CONJUNTO DE ARMARIOS MODULADOS: Instale um conjunto completo de armarios de cozinha modulados em MDF/aglomerado, padrao de mercado popular (sem laqueado, sem high-gloss). Escolha a opcao que melhor harmoniza com as paredes e piso existentes:
   - Opcao A — Branco com porta relevo (mais tradicional/popular): Todas as portas (armarios baixos, aereos e paneleiro alto) em MDF branco com painel em relevo decorativo, motivo de linhas curvas e detalhe em losango no centro. Puxadores barra cromados. Bancada em inox ou laminado cinza claro. Salpicao: azulejo portugues colorido (azul, amarelo e branco) ou azulejo branco simples.
   - Opcao B — Freijo + preto fosco (mais moderno popular): Portas em MDF preto fosco padrao (sem laqueado) com estrutura e laterais em laminado freijo (MDF com laminado amadeirado, nao madeira macica). Puxadores barra cromados ou niquel escovado. Bancada em laminado freijo (formica amadeirada). Fundo: parede branca ou azulejo branco simples.

2. ELETRODOMESTICOS (obrigatorio em ambas as opcoes):
   - Geladeira branca frost-free padrao posicionada em uma das extremidades do conjunto de armarios.
   - Micro-ondas branco sobre a bancada ou em nicho dedicado.
   - Fogao de piso branco 4 bocas com forno, posicionado na area de cocao se visivel.

3. ACESSORIOS: Um vaso pequeno com planta simples ou flores basicas sobre a bancada. Nao poluir a cena.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas ou qualquer elemento fixo do imovel.
2. NAO MUDE PISOS OU PAREDES: Nao substitua pisos, nao adicione porcelanato, nao altere o revestimento de paredes ja existente na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas ou texturas de materiais originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original.
5. PADRAO POPULAR OBRIGATORIO: Todos os armarios em MDF/aglomerado padrao popular — sem laqueado, sem high-gloss, sem materiais nobres. Puxadores consistentes em toda a cozinha (todos cromados OU todos niquel escovado, nunca misturados). Sem bancadas em marmore ou pedra natural.

Resultado esperado: Uma fotografia imobiliaria profissional da cozinha mobiliada com moveis de padrao popular brasileiro, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,
}

export const MODERNO_BRASILEIRO_PROMPTS = {
  living_room: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished living room in the Brazilian contemporary modern style. OUTPUT: Photorealistic furnished living room photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario contemporaneo brasileiro de medio-alto padrao. Sua tarefa e mobiliar digitalmente a sala de estar vazia ou semi-vazia da imagem fornecida com moveis de padrao moderno brasileiro, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — SALA DE ESTAR MODERNO BRASILEIRO:

1. SOFA: Sofa baixo e amplo em tecido bege claro, off-white ou cinza claro, com encosto baixo e linhas horizontais limpas. Almofadas decorativas em cores contrastantes — terracota, cinza grafite, verde-musgo e bege, misturando texturas lisas e com padrao geometrico sutil. Sem capitone. Sem braccos excessivamente largos.

2. MESA LATERAL: Mesinha lateral pequena e redonda em metal escuro (preto fosco ou grafite), posicionada ao lado do sofa. Modelo fino e minimalista.

3. TAPETE: Tapete retangular de pelo baixo em tom neutro — bege, cinza claro ou off-white — centralizado sob o conjunto de sofa.

4. RACK / PAINEL DE TV: Rack suspenso ou de piso em MDF com combinacao de laca branca e nicho amadeirado (freijo ou nogal), com iluminacao de fita LED embutida no nicho. Televisor de tela plana fixado na parede acima ou posicionado sobre o rack.

5. MESA DE JANTAR (se o espaco permitir area de jantar integrada): Mesa retangular branca com tampo liso, pernas finas em metal ou madeira. Cadeiras com assento estofado em tecido cinza escuro e estrutura geometrica. Pendente sobre a mesa: lustre com hastes em latao/dourado e globos de vidro transparente.

6. PLANTA: Uma planta media-grande em vaso de ceramica branca ou cimento, posicionada em canto da sala ou na transicao entre ambientes.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, spots embutidos, gesso, armarios embutidos ou qualquer elemento fixo do imovel.
2. NAO ADICIONE REVESTIMENTOS: Nao insira paineis de parede, papel de parede, revestimento em pedra ou qualquer acabamento que nao esteja na foto original. As paredes devem permanecer exatamente como estao.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de pisos ou materiais originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. Nao adicione nem remova fontes de luz.
5. PADRAO MODERNO OBRIGATORIO: Moveis com linhas limpas e contemporaneas. MDF em laca branca ou cinza combinado com detalhes amadeirados. Sem moveis rusticos, sem capitone excessivo, sem dourado exagerado. Estetica de apartamento decorado de incorporadora brasileira de medio-alto padrao.

Resultado esperado: Uma fotografia imobiliaria profissional da sala de estar mobiliada no estilo moderno brasileiro contemporaneo, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  bedroom: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished bedroom in the Brazilian contemporary modern style. OUTPUT: Photorealistic furnished bedroom photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario contemporaneo brasileiro de medio-alto padrao. Sua tarefa e mobiliar digitalmente o quarto vazio ou semi-vazio da imagem fornecida com moveis de padrao moderno brasileiro, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — QUARTO MODERNO BRASILEIRO:

1. GUARDA-ROUPA: Guarda-roupa planejado em MDF com combinacao de portas em laca branca ou cinza claro e modulo em laminado amadeirado (freijo ou carvalho). Portas de correr preferencialmente, ou portas de abrir com puxadores slim em metal escovado ou latao. Altura ate o teto (piso ao teto) sempre que o espaco permitir. Posicionado na parede principal do quarto.

2. CAMA: Cama de casal ou queen size. Base box em madeira ou estofada em tecido cinza claro ou bege. Cabeceira estofada alta em tecido linho, cinza ou bege, com capitone discreta ou costura linear. Roupa de cama em tons neutros: branco, cinza perola, bege — lencois de algodao com aspecto de hotel, edredom com textura suave, travesseiros com fronha lisa e fronha com padrao geometrico sutil.

3. CRIADO-MUDO: Criado-mudo flutuante (suspenso na parede) ou de piso com 1 gaveta, em MDF branco ou amadeirado combinando com o guarda-roupa. Abajur com base em metal dourado ou cobre e cupula em tecido branco ou bege, em cada lado da cama.

4. COMODA OU PENTEADEIRA (opcional, se houver espaco): Comoda baixa em MDF branco com puxadores em metal escovado, ou penteadeira minimalista com espelho redondo em moldura metalica dourada ou preta.

5. TAPETE: Tapete retangular de pelo medio em cinza claro, bege ou off-white, posicionado sob a cama com as beiradas aparentes nas laterais.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, spots embutidos, gesso ou qualquer elemento fixo do imovel.
2. NAO ADICIONE REVESTIMENTOS: Nao insira paineis de parede, papel de parede, ripado, gesso 3D ou qualquer acabamento que nao esteja na foto original. As paredes devem permanecer exatamente como estao.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas, texturas de pisos ou materiais originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. Nao adicione nem remova fontes de luz.
5. PADRAO MODERNO OBRIGATORIO: Moveis com linhas limpas e contemporaneas. Combinacao de MDF laca branca/cinza com detalhes amadeirados. Puxadores slim em metal escovado ou latao. Sem moveis rusticos, sem excesso de dourado, sem espelhos jateados. Estetica de apartamento decorado de incorporadora brasileira de medio-alto padrao.

Resultado esperado: Uma fotografia imobiliaria profissional do quarto mobiliado no estilo moderno brasileiro contemporaneo, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  kitchen: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished kitchen in the Brazilian contemporary modern style. OUTPUT: Photorealistic furnished kitchen photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario contemporaneo brasileiro de medio-alto padrao. Sua tarefa e mobiliar digitalmente a cozinha vazia ou semi-vazia da imagem fornecida com moveis de padrao moderno brasileiro, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — COZINHA MODERNO BRASILEIRO:

1. CONJUNTO DE ARMARIOS PLANEJADOS: Armarios modulados em MDF cinza medio fosco (cinza urbano) com puxadores integrados embutidos (sem puxador aparente) ou puxadores slim em metal escovado. Estrutura e detalhes em laminado amadeirado (freijo ou carvalho claro). Configuracao completa:
   - Armarios aereos: portas retas em cinza fosco ate proximo ao teto, com nicho aberto revestido em laminado amadeirado com fita de LED embutida na parte inferior exibindo pequenos objetos decorativos.
   - Armarios baixos: portas e gavetas em cinza fosco com puxadores integrados ou slim.
   - Paneleiro ou torre: integrado ao conjunto, em cinza fosco.

2. BANCADA: Bancada em marmore branco ou cinza claro com veios finos (marmore carrara ou similar) ou porcelanato marmorizado — aspecto premium. Tampo com espessura aparente de 3 a 4cm.

3. SALPICAO (backsplash): Revestimento em marmore branco ou porcelanato marmorizado, combinando com a bancada. Sem azulejo colorido.

4. ELETRODOMESTICOS:
   - Geladeira french door ou side-by-side em inox escovado, posicionada na lateral ou extremidade dos armarios.
   - Cooktop a gas de 4 ou 5 bocas embutido na bancada, modelo inox.
   - Micro-ondas ou forno eletrico embutido em nicho dedicado nos armarios, modelo inox ou preto.
   - Exaustor ou depurador slim sobre o cooktop, em inox ou preto.

5. ACESSORIOS: Dois ou tres objetos decorativos no nicho amadeirado — pequenos vasos, livros de cozinha ou potes de vidro com especiarias. Um vaso slim com ramo vegetal sobre a bancada. Nao poluir a cena.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, spots embutidos ou qualquer elemento fixo do imovel.
2. NAO MUDE PISOS OU PAREDES: Nao substitua pisos, nao altere revestimentos ja existentes na foto original.
3. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas ou texturas de materiais originais.
4. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. Nao adicione nem remova fontes de luz.
5. PADRAO MODERNO OBRIGATORIO: Armarios em MDF cinza fosco com nicho amadeirado — sem laca branca, sem porta relevo, sem azulejo portugues. Eletrodomesticos em inox ou preto. Bancada em marmore ou porcelanato marmorizado. Estetica de cozinha planejada de apartamento decorado de incorporadora brasileira de medio-alto padrao.

Resultado esperado: Uma fotografia imobiliaria profissional da cozinha mobiliada no estilo moderno brasileiro contemporaneo, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,

  bathroom: `Edit and return the provided real estate photo with professional virtual staging applied — furnishing an empty or unfurnished bathroom in the Brazilian contemporary modern style. OUTPUT: Photorealistic furnished bathroom photo, same resolution and framing as input.

Atue como um decorador virtual especializado no mercado imobiliario contemporaneo brasileiro de medio-alto padrao. Sua tarefa e mobiliar digitalmente o banheiro vazio ou semi-vazio da imagem fornecida com moveis de padrao moderno brasileiro, de forma fotorrealista e indistinguivel de uma fotografia real.

INSTRUCOES DE MOBILIAMENTO — BANHEIRO MODERNO BRASILEIRO:

1. GABINETE: Gabinete em MDF com laca branca ou cinza claro, acabamento fosco ou acetinado. Configuracao: 2 a 4 portas retas lisas + 2 a 3 gavetas empilhadas em um dos lados. Puxadores slim embutidos (sem puxador aparente) ou barra em metal escovado. Base com rodape integrado — sem pes aparentes. Largura proporcional ao ambiente.

2. BANCADA: Bancada em marmore branco ou cinza claro com veios finos (carrara ou similar) ou porcelanato marmorizado, com espessura de 3cm aparente. Cuba de embutir retangular em louca branca, embutida na bancada (nao sobre ela).

3. TORNEIRA: Torneira monocomando em metal preto fosco ou cromado escovado, modelo alto de bica reta, fixada no tampo da bancada.

4. ESPELHO: Espelho grande de formato retangular com cantos levemente arredondados e moldura fina em metal champagne, rose gold ou preto fosco. Centralizado acima do gabinete, ocupando boa parte da parede. Sem prateleira integrada.

5. ILUMINACAO SOBRE O ESPELHO (se a estrutura original ja tiver ponto de luz na parede): Dois pendentes tubulares slim em metal com detalhes em madeira, um de cada lado do espelho, com luz quente.

6. VASO SANITARIO: Vaso sanitario branco com caixa acoplada de design moderno (linhas retas, sem curvas excessivas), posicionado na parede hidraulica.

7. PAREDES (se estiverem sem revestimento): Porcelanato de grande formato (60x120cm ou maior) em tom claro — off-white, cinza claro ou bege — cobrindo toda a extensao das paredes visiveis. Em pelo menos uma parede lateral, inserir revestimento em laminado amadeirado (freijo ou carvalho) do piso ao teto como parede de destaque.

8. PISO: Porcelanato de grande formato (60x60cm ou maior) em cinza claro acetinado.

9. ACESSORIOS: Dispenser de sabonete em metal preto fosco ou inox sobre a bancada. Toalha de rosto dobrada em tom bege ou cinza claro, posicionada sobre o gabinete ou em porta-toalha de barra em metal escovado fixado na parede. Pequeno vaso slim com ramo vegetal (eucalipto ou samambaia) na bancada.

RESTRICOES CRITICAS E ABSOLUTAS (O QUE NAO TOCAR):

1. NAO ALTERE A ESTRUTURA: Nao mude paredes, teto, piso, janelas, portas, luminarias fixas, spots embutidos ou qualquer elemento fixo do imovel.
2. NAO MUDE PISOS OU REVESTIMENTOS: Nao substitua pisos ou revestimentos ja existentes na foto original.
3. NAO ADICIONE REVESTIMENTOS NAO PREVISTOS: Adicione revestimento de parede SOMENTE se as paredes estiverem completamente sem acabamento na foto original.
4. NAO MUDE O DESIGN EXISTENTE: Nao altere cores de tintas ou texturas de materiais originais.
5. NAO ALTERE A ILUMINACAO: Mantenha as condicoes exatas de luz, sombra e reflexos da fotografia original. Nao adicione nem remova fontes de luz.
6. PADRAO MODERNO OBRIGATORIO: Gabinete em MDF laca branca ou cinza fosco com cuba embutida. Torneira preta fosca ou cromada escovada. Espelho com moldura fina metalica. Sem azulejo 20x20, sem cuba de apoio sobre tampo, sem puxadores cromados basicos. Estetica de banheiro planejado de apartamento decorado de incorporadora brasileira de medio-alto padrao.

Resultado esperado: Uma fotografia imobiliaria profissional do banheiro mobiliado no estilo moderno brasileiro contemporaneo, fotorrealista e indistinguivel de uma foto real, com a estrutura do imovel completamente preservada.`,
}
