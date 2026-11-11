import {
  useState,
  useRef,
  type DragEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { ICamera, IX } from "@/componentes/icones";
import estilos from "./UploadDeFoto.module.css";

export const FORMATOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

interface UploadDeFotoProps {
  fotoInicial?: string | null;
  aoMudar: (arquivo: File | null, url: string | null) => void;
  erro?: string;
}

export function UploadDeFoto({
  fotoInicial,
  aoMudar,
  erro,
}: UploadDeFotoProps) {
  const [previa, setPrevia] = useState<string | null>(fotoInicial ?? null);
  const [arrastando, setArrastando] = useState(false);
  const [erroInterno, setErroInterno] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const validarArquivo = (arquivo: File): string | null => {
    if (!FORMATOS_ACEITOS.includes(arquivo.type)) {
      return "O arquivo deve estar em um dos formatos: PNG, JPG ou WEBP.";
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      return "O arquivo excede o limite de 10 MB.";
    }
    return null;
  };

  const processarArquivo = (arquivo: File) => {
    const erroValidacao = validarArquivo(arquivo);
    if (erroValidacao) {
      setErroInterno(erroValidacao);
      return;
    }

    setErroInterno(undefined);
    const url = URL.createObjectURL ? URL.createObjectURL(arquivo) : "";
    setPrevia(url);
    aoMudar(arquivo, url);
  };

  const aoMudarInput = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivos = evento.target.files;
    if (arquivos && arquivos.length > 0) {
      processarArquivo(arquivos[0]!);
    }
  };

  const aoArrastarSobre = (evento: DragEvent) => {
    evento.preventDefault();
    setArrastando(true);
  };

  const aoSairDoArrasto = (evento: DragEvent) => {
    evento.preventDefault();
    setArrastando(false);
  };

  const aoSoltar = (evento: DragEvent) => {
    evento.preventDefault();
    setArrastando(false);
    const arquivos = evento.dataTransfer.files;
    if (arquivos && arquivos.length > 0) {
      processarArquivo(arquivos[0]!);
    }
  };

  const acionarEscolha = () => {
    inputRef.current?.click();
  };

  const aoPressionarTecla = (evento: KeyboardEvent) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      acionarEscolha();
    }
  };

  const removerFoto = () => {
    setPrevia(null);
    setErroInterno(undefined);
    if (inputRef.current) inputRef.current.value = "";
    aoMudar(null, null);
  };

  const mensagemDeErro = erro || erroInterno;

  return (
    <div className={estilos.container}>
      <span className={estilos.rotulo}>Foto do produto</span>

      {previa ? (
        <div className={estilos.previaContainer}>
          <img
            src={previa}
            alt="Pré-visualização da foto do produto"
            className={estilos.imagemPrevia}
          />
          <button
            type="button"
            className={estilos.botaoRemover}
            onClick={removerFoto}
            aria-label="Remover foto"
            title="Remover foto"
          >
            <IX size={16} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`${estilos.areaDrop} ${
            arrastando ? estilos.arrastando : ""
          }`}
          onClick={acionarEscolha}
          onKeyDown={aoPressionarTecla}
          onDragOver={aoArrastarSobre}
          onDragLeave={aoSairDoArrasto}
          onDrop={aoSoltar}
          aria-label="Adicionar foto"
        >
          <span className={estilos.iconeCamera} aria-hidden="true">
            <ICamera size={32} />
          </span>
          <span className={estilos.textoPrincipal}>Adicionar foto</span>
          <span className={estilos.textoFormatos}>
            PNG, JPG ou WEBP · máx. 10MB
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className={estilos.inputOculto}
        onChange={aoMudarInput}
        aria-hidden="true"
        tabIndex={-1}
      />

      <p className={estilos.dica}>
        Opcional · Anúncios com foto recebem mais propostas
      </p>
      {mensagemDeErro && (
        <p className={estilos.erro} role="alert">
          {mensagemDeErro}
        </p>
      )}
    </div>
  );
}
