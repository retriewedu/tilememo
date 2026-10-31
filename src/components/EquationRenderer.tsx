import React, { useMemo } from 'react';
import katex from 'katex';

interface EquationRendererProps {
  equation: string;
  displayMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const EquationRenderer: React.FC<EquationRendererProps> = ({
  equation,
  displayMode = true,
  className = '',
  style,
}) => {
  const html = useMemo(() => {
    if (!equation || !equation.trim()) return '';
    try {
      return katex.renderToString(equation.trim(), {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (err) {
      console.warn('KaTeX render error:', err);
      return `<span class="text-rose-400 font-mono text-xs">Error: ${(err as Error).message}</span>`;
    }
  }, [equation, displayMode]);

  if (!equation || !equation.trim()) {
    return <span className="text-slate-500 italic text-xs">(Persamaan kosong)</span>;
  }

  return (
    <div
      className={`overflow-x-auto overflow-y-hidden max-w-full ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const EQUATION_TEMPLATES = [
  { name: 'Einstein (Massa-Energi)', latex: 'E = m c^2', desc: 'Relativitas Khusus' },
  { name: 'Rumus Kuadratik', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: 'Aljabar' },
  { name: 'Teorema Pythagoras', latex: 'a^2 + b^2 = c^2', desc: 'Geometri' },
  { name: 'Identitas Euler', latex: 'e^{i\\pi} + 1 = 0', desc: 'Analisis Kompleks' },
  { name: 'Kalkulus Integral', latex: '\\int_a^b f(x) \\, dx = F(b) - F(a)', desc: 'Teorema Dasar' },
  { name: 'Hukum Newton II', latex: '\\vec{F} = m \\cdot \\vec{a}', desc: 'Mekanika Klasik' },
  { name: 'Distribusi Normal', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2} \\left( \\frac{x - \\mu}{\\sigma} \\right)^2}', desc: 'Probabilitas' },
  { name: 'Limit Tak Hingga', latex: '\\lim_{n \\to \\infty} \\left( 1 + \\frac{1}{n} \\right)^n = e', desc: 'Limit' },
  { name: 'Matriks 2x2', latex: 'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', desc: 'Aljabar Linier' },
  { name: 'Deret Penjumlahan', latex: '\\sum_{k=1}^n k = \\frac{n(n+1)}{2}', desc: 'Deret Aritmetika' },
];

export const MATH_SYMBOLS = [
  { label: 'π', latex: '\\pi' },
  { label: 'θ', latex: '\\theta' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'Δ', latex: '\\Delta' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: 'x/y', latex: '\\frac{a}{b}' },
  { label: 'x²', latex: 'x^2' },
  { label: 'x_n', latex: 'x_n' },
  { label: '∫', latex: '\\int' },
  { label: '∑', latex: '\\sum_{i=1}^n' },
  { label: 'lim', latex: '\\lim_{x \\to 0}' },
  { label: '±', latex: '\\pm' },
  { label: '≠', latex: '\\neq' },
  { label: '≤', latex: '\\le' },
  { label: '≥', latex: '\\ge' },
  { label: '∞', latex: '\\infty' },
  { label: '→', latex: '\\to' },
  { label: '≈', latex: '\\approx' },
];
