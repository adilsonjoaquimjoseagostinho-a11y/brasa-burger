import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { empresa, cardapio } from './data.js'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 240
const ULTIMO = FRAME_COUNT - 1
const framePath = (i) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`

const etapas = [
  { n: '01', titulo: 'Escolha', texto: 'Monte seu pedido pelo cardápio ou peça um dos nossos clássicos.' },
  { n: '02', titulo: 'Chame no WhatsApp', texto: 'Envie o pedido e confirme endereço ou retirada no balcão.' },
  { n: '03', titulo: 'Receba quentinho', texto: 'Embalado na hora, no saco kraft, para chegar do jeito que foi feito.' },
]

// Cada painel aparece e some em uma faixa do scroll (0 = início, 1 = fim)
// O saco fecha perto de 1, junto com o rodapé.
const faixas = { sobre: [0.1, 0.22], prato0: [0.25, 0.34], prato1: [0.37, 0.46], prato2: [0.49, 0.58], prato3: [0.61, 0.7], pedir: [0.73, 0.81], contato: [0.84, 0.9], rodape: [0.93, 1] }

function fade(p, a, b) {
  const e = 0.04
  if (p < a || p > b) return 0
  return Math.max(0, Math.min((p - a) / e, (b - p) / e, 1))
}

export default function App() {
  const trilhaRef = useRef(null)
  const canvasRef = useRef(null)
  const heroRef = useRef(null)
  const painelRefs = useRef({})
  const framesRef = useRef([])
  const [pronto, setPronto] = useState(0)

  const linkWhats = `https://wa.me/${empresa.whatsapp}?text=${encodeURIComponent('Olá! Quero fazer um pedido na Brasa Burger.')}`

  useEffect(() => {
    let carregados = 0
    const frames = []
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.src = framePath(i)
      img.onload = () => {
        carregados++
        setPronto(Math.round((carregados / FRAME_COUNT) * 100))
      }
      frames.push(img)
    }
    framesRef.current = frames
  }, [])

  const desenhar = (indice) => {
    const canvas = canvasRef.current
    const img = framesRef.current[indice]
    if (!canvas || !img || !img.complete || !img.naturalWidth) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * escala
    const dh = img.naturalHeight * escala
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  }

  const ajustarCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
  }

  useEffect(() => {
    ajustarCanvas()
    const atual = { i: 0 }
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const aoRedimensionar = () => {
      ajustarCanvas()
      desenhar(atual.i)
    }
    window.addEventListener('resize', aoRedimensionar)

    // Mostra todos os painéis no estado final (sem animação)
    const mostrarFinal = () => {
      Object.values(painelRefs.current).forEach((el) => el && (el.style.opacity = 1))
    }

    const esperarPrimeiro = setInterval(() => {
      if (framesRef.current[0]?.complete) {
        clearInterval(esperarPrimeiro)
        desenhar(reduzir ? ULTIMO : 0)
        if (reduzir) {
          atual.i = ULTIMO
          mostrarFinal()
        }
      }
    }, 150)

    let st = null
    if (!reduzir) {
      st = ScrollTrigger.create({
        trigger: trilhaRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress
          atual.i = Math.round(p * ULTIMO)
          desenhar(atual.i)

          if (heroRef.current) heroRef.current.style.opacity = Math.max(0, 1 - p / 0.12)

          Object.entries(faixas).forEach(([id, [a, b]]) => {
            const el = painelRefs.current[id]
            if (!el) return
            const t = fade(p, a, b)
            el.style.opacity = t
            el.style.transform = `translateY(${(1 - t) * 24}px)`
            el.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
          })
        },
      })
    } else {
      mostrarFinal()
    }

    return () => {
      clearInterval(esperarPrimeiro)
      window.removeEventListener('resize', aoRedimensionar)
      if (st) st.kill()
    }
  }, [])

  const ref = (id) => (el) => (painelRefs.current[id] = el)

  return (
    <>
      <canvas ref={canvasRef} className="fundo-video" />
      <div className="degrade" />
      <div className="escurecer" />

      <header className="menu">
        <span className="marca">{empresa.nome}</span>
        <nav>
          <span>Hambúrguer artesanal</span>
        </nav>
      </header>

      <div className="titulo-inicial" ref={heroRef}>
        <p className="kicker">Hambúrguer artesanal</p>
        <h1>{empresa.nome}</h1>
        <p className="slogan">{empresa.slogan}</p>
        <span className="dica">Role para montar o seu hambúrguer ↓</span>
      </div>

      {pronto < 100 && <div className="carregando">Carregando {pronto}%</div>}

      {/* Painéis que acompanham o vídeo durante o scroll */}
      <div className="painel" ref={ref('sobre')} style={{ opacity: 0 }}>
        <div className="caixa caixa-livre">
          <p className="rotulo">Sobre nós</p>
          <h2>Ingredientes escolhidos a dedo, montados na hora</h2>
          <p className="texto">
            Na {empresa.nome} cada hambúrguer é montado no momento do pedido. Pão macio, carne suculenta e
            ingredientes frescos, do jeito que você escolher.
          </p>
        </div>
      </div>

      {cardapio.map((item, i) => (
        <div key={item.nome} className={`painel painel-prato ${i % 2 ? 'dir' : 'esq'}`} ref={ref(`prato${i}`)} style={{ opacity: 0 }}>
          <div className="prato-grande">
            <span className="indice">0{i + 1} / 0{cardapio.length}</span>
            <h2>{item.nome}</h2>
            <span className="preco-grande">{item.preco}</span>
            <p>{item.desc}</p>
          </div>
        </div>
      ))}

      <div className="painel" ref={ref('pedir')} style={{ opacity: 0 }}>
        <div className="caixa caixa-livre">
          <p className="rotulo">Como pedir</p>
          <h2>Simples, rápido e pelo WhatsApp</h2>
          <ol className="passos">
            {etapas.map((e) => (
              <li key={e.n} className="passo">
                <span className="numero">{e.n}</span>
                <h3>{e.titulo}</h3>
                <p>{e.texto}</p>
              </li>
            ))}
          </ol>
          <a className="botao" href={linkWhats} target="_blank" rel="noreferrer">Fazer pedido no WhatsApp</a>
        </div>
      </div>

      <div className="painel" ref={ref('contato')} style={{ opacity: 0 }}>
        <div className="caixa">
          <p className="rotulo">Contato</p>
          <h2>Venha nos visitar</h2>
          <dl className="info">
            <div><dt>Endereço</dt><dd>{empresa.cidade}</dd></div>
            <div><dt>Horário</dt><dd>{empresa.horario}</dd></div>
            <div><dt>Instagram</dt><dd>{empresa.instagram}</dd></div>
          </dl>
        </div>
      </div>

      <div className="painel rodape-painel" ref={ref('rodape')} style={{ opacity: 0 }}>
        <footer className="rodape">
          <p className="marca">{empresa.nome}</p>
          <p>© {new Date().getFullYear()} {empresa.nome}. Todos os direitos reservados.</p>
        </footer>
      </div>

      {/* Área de rolagem: a cena avança conforme você desce */}
      <div className="trilha" ref={trilhaRef} />
    </>
  )
}
