import os
import re
from crewai import Agent, Task, Crew, Process
from textwrap import dedent

# Importaciones para usar Gemini (LLM) y Herramientas gratuitas
from langchain_google_genai import ChatGoogleGenerativeAI
from crewai_tools import FileWriterTool, ScrapeWebsiteTool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import Tool

from dotenv import load_dotenv
load_dotenv() # Carga las variables de entorno desde el archivo .env

# ==========================================
# CONFIGURACIÓN DEL LLM (Gemini 100% Gratis)
# ==========================================
# Necesitas obtener una API key gratuita en: https://aistudio.google.com/
# Puedes ponerla como variable de entorno. Por ejemplo:
# os.environ["GOOGLE_API_KEY"] = "TU_API_KEY_AQUI"

llm_gemini = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro", # Puedes usar gemini-1.5-flash si quieres que responda más rápido
    verbose=True,
    temperature=0.5
)

# ==========================================
# CONFIGURACIÓN DE HERRAMIENTAS (Tools) GRATUITAS
# ==========================================
# 1. Búsqueda Web con DuckDuckGo (Gratis, sin API)
search_tool = DuckDuckGoSearchRun()
web_search = Tool(
    name="Busqueda Web DuckDuckGo",
    func=search_tool.run,
    description="Útil para buscar en internet información de mercado, documentación, o tendencias actuales."
)

# 2. Herramienta para leer contenido de sitios web (Gratis)
scrape_tool = ScrapeWebsiteTool()

# 3. Herramienta para escribir archivos en el sistema local (Gratis)
# Permite a los agentes exportar su código y guiones directamente a archivos reales en tu PC.
file_writer_tool = FileWriterTool()

# ==========================================
# 1. DEFINICIÓN DE AGENTES PREMIUM (Armados con Herramientas)
# ==========================================

cto_agent = Agent(
    role='CTO y Desarrollador Full-Stack Premium',
    goal='Desarrollar código de producción modular y arquitecturas SaaS escalables escribiendo los archivos directamente en el proyecto.',
    backstory=dedent("""\
        Eres un Arquitecto de Software de Élite. Tienes experiencia creando plataformas SaaS tipo 'Structa'.
        Usa tus herramientas para buscar documentación técnica en internet, leer webs y ESCRIBIR el código 
        directamente en archivos del sistema local usando tu FileWriterTool.
    """),
    llm=llm_gemini,
    tools=[web_search, scrape_tool, file_writer_tool],
    verbose=True,
    allow_delegation=False
)

marketing_agent = Agent(
    role='CMO y Estratega de Marketing B2B Orgánico',
    goal='Diseñar estrategias PLG y buscar tendencias de mercado en la web para lograr conversiones sin Ads.',
    backstory=dedent("""\
        Eres un CMO enfocado en PLG (Product-Led Growth). 
        Usa la búsqueda web y el scraping para investigar a la competencia y las tendencias reales de hoy.
        Escribe tus planes y plantillas de prospección en archivos locales usando el FileWriterTool.
    """),
    llm=llm_gemini,
    tools=[web_search, scrape_tool, file_writer_tool],
    verbose=True,
    allow_delegation=False
)

game_designer_agent = Agent(
    role='Programador Senior y Game Designer de Unity',
    goal='Escribir mecánicas adictivas en scripts .cs de Unity hiper-optimizados para Android.',
    backstory=dedent("""\
        Eres un Game Designer Senior de F2P Mobile.
        Usa tus herramientas para buscar en internet cómo implementar Ads u otras APIS modernas en Unity.
        Crea y escribe tus scripts C# listos para Unity usando el FileWriterTool.
    """),
    llm=llm_gemini,
    tools=[web_search, file_writer_tool],
    verbose=True,
    allow_delegation=False
)

animation_director_agent = Agent(
    role='Director de Animación e Ingeniero de Prompts Visuales',
    goal='Crear Prompts Maestros visuales para IA y guardarlos en archivos estructurados, asegurando la continuidad de personajes.',
    backstory=dedent("""\
        Eres un Creador de Prompts Maestros visuales para IA generativa.
        
        REGLA ESTRICTA DE CONTINUIDAD: Tienes TERMINANTEMENTE PROHIBIDO incluir nombres propios en los prompts 
        generados. Traduce siempre:
        - Zain: 'joven protagonista, estilo anime shonen, cabello oscuro alborotado, vistiendo una chaqueta negra, con un brazo mecánico de alta tecnología que emite energía y luz azul'
        - Tanji: 'guerrero veterano, corpulento, con cicatrices en el rostro, armadura samurái desgastada y una gran espada de doble filo'
        - Rina: 'chica ágil y misteriosa, vestimenta cyberpunk con luces de neón, cabello corto color plateado, portando dagas de energía'
        
        Usa la herramienta FileWriterTool para exportar tus prompts maestros a archivos locales en formato .txt
    """),
    llm=llm_gemini,
    tools=[file_writer_tool],
    verbose=True,
    allow_delegation=False
)

# ==========================================
# 2. DEFINICIÓN DE TAREAS (Ahora conectadas a las Herramientas)
# ==========================================

task_cto = Task(
    description=dedent("""\
        1. Busca en la web las mejores prácticas actuales para integrar Stripe en React y Node.js.
        2. Escribe un archivo local llamado 'arquitectura_saas.md' detallando la arquitectura y el código clave, utilizando tu herramienta FileWriterTool.
    """),
    expected_output="Archivo local 'arquitectura_saas.md' escrito en el disco duro con el código SaaS B2B.",
    agent=cto_agent
)

task_marketing = Task(
    description=dedent("""\
        1. Usa la búsqueda web para analizar al menos 2 estrategias de PLG B2B exitosas recientes.
        2. Escribe un archivo local llamado 'estrategia_marketing.txt' con un embudo de ventas detallado y plantillas de correo usando FileWriterTool.
    """),
    expected_output="Archivo local 'estrategia_marketing.txt' creado exitosamente.",
    agent=marketing_agent
)

task_gamedev = Task(
    description=dedent("""\
        1. Busca en internet ejemplos de código Core Loop altamente adictivos para juegos móviles F2P actuales.
        2. Escribe un script C# llamado 'CoreLoopController.cs' en el disco local utilizando tu FileWriterTool.
    """),
    expected_output="Archivo local 'CoreLoopController.cs' escrito exitosamente.",
    agent=game_designer_agent
)

task_animation = Task(
    description=dedent("""\
        1. Crea un guion corto de manga donde Zain, Tanji y Rina interactúen. 
        2. APLICA LA REGLA ESTRICTA de sustituir los nombres por sus descripciones físicas.
        3. Escribe un archivo local llamado 'prompts_video.txt' con la lista final de prompts para IA usando tu FileWriterTool.
    """),
    expected_output="Archivo local 'prompts_video.txt' con descripciones literales sin nombres, creado exitosamente.",
    agent=animation_director_agent
)

# ==========================================
# 3. ORQUESTACIÓN DEL CREW
# ==========================================

def run_ecosystem():
    print("Iniciando el Ecosistema Premium 100% Gratuito (Gemini LLM)...")
    
    # Proceso secuencial: CTO -> Marketing -> GameDev -> Animation
    digital_empire_crew = Crew(
        agents=[cto_agent, marketing_agent, game_designer_agent, animation_director_agent],
        tasks=[task_cto, task_marketing, task_gamedev, task_animation],
        process=Process.sequential,
        verbose=True
    )
    
    result = digital_empire_crew.kickoff()
    
    print("==========================================")
    print("RESULTADO FINAL DEL ECOSISTEMA")
    print("==========================================")
    print(result)
    
    return result

if __name__ == "__main__":
    # run_ecosystem()
    pass
