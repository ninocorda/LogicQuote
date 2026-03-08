import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type TimeUnit = 'horas' | 'días' | 'semanas' | 'meses';

interface ServiceItem {
  id: string;
  description: string;
  time: number;
  timeUnit: TimeUnit;
  price: number;
}

const A4_WIDTH_PX = 794; // 210mm in pixels at 96dpi

export default function PresupuestoLogica() {
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ServiceItem[]>([
    { id: '1', description: 'Desarrollo Frontend', time: 10, timeUnit: 'horas', price: 500 }
  ]);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  // Dynamically calculate scale so the A4 paper fits within the container
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.offsetWidth;
      const scale = Math.min(containerWidth / A4_WIDTH_PX, 1);
      setPreviewScale(scale);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', time: 1, timeUnit: 'horas', price: 0 }
    ]);
  };

  const updateItem = (id: string, field: keyof ServiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalTimeHoras = items.filter(i => i.timeUnit === 'horas').reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
  const totalTimeDias = items.filter(i => i.timeUnit === 'días').reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
  const totalTimeSemanas = items.filter(i => i.timeUnit === 'semanas').reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
  const totalTimeMeses = items.filter(i => i.timeUnit === 'meses').reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
  const totalPrice = items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;

    try {
      // Fix for cut-off PDF: Clone element, place it off-screen, absolute, with no constraints.
      const element = previewRef.current;
      const clonedElement = element.cloneNode(true) as HTMLElement;

      clonedElement.style.position = 'absolute';
      clonedElement.style.top = '-9999px';
      clonedElement.style.left = '-9999px';
      clonedElement.style.width = '210mm';
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.transform = 'none';
      // Ensure height fits content perfectly without artificial limit for canvas
      clonedElement.style.minHeight = '297mm';
      clonedElement.style.height = 'auto';

      document.body.appendChild(clonedElement);

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight
      });

      document.body.removeChild(clonedElement);

      const imgData = canvas.toDataURL('image/png');

      // Single page: A4 width (210mm), height adjusts dynamically to fit all content
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Presupuesto-${projectTitle || 'LogicQuote'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Hubo un error al generar el PDF.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">LogicQuote</h1>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* EDITOR (Izquierda) */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-lg font-semibold mb-4">Detalles del Proyecto</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Acme Corp"
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Título del Proyecto</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Ej. Rediseño Web"
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Servicios</h2>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 relative group transition-all">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-2 -right-2 bg-white border border-neutral-200 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Descripción</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          placeholder="Ej. Diseño UI/UX"
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Tiempo</label>
                          <input
                            type="number"
                            min="0"
                            value={item.time}
                            onChange={(e) => updateItem(item.id, 'time', parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Unidad</label>
                          <select
                            value={item.timeUnit}
                            onChange={(e) => updateItem(item.id, 'timeUnit', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 appearance-none"
                          >
                            <option value="horas">Horas</option>
                            <option value="días">Días</option>
                            <option value="semanas">Semanas</option>
                            <option value="meses">Meses</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Precio ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-500 font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Añadir Servicio</span>
                </button>
              </div>
            </section>
          </div>

          {/* PREVIEW A4 (Derecha) */}
          <div ref={previewContainerRef} className="w-full">
            <div
              className="sticky top-24 origin-top-left"
              style={{
                width: `${A4_WIDTH_PX}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <div className="shadow-2xl rounded-sm bg-white border border-neutral-200">
                <div
                  ref={previewRef}
                  className="bg-white text-neutral-900"
                  style={{ width: `${A4_WIDTH_PX}px`, minHeight: '1123px', padding: '100px 60px 60px 60px', boxSizing: 'border-box' }}
                >
                  <div className="flex justify-between items-end mb-16 border-b border-neutral-200 pb-8">
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight text-neutral-900">PRESUPUESTO</h1>
                      <p className="text-neutral-500 mt-2">#{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-neutral-900">LogicQuote.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-16">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Para</h3>
                      <p className="text-base font-medium">{clientName || 'Nombre del Cliente'}</p>
                    </div>
                    <div>
                      <div className="mb-4">
                        <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Proyecto</h3>
                        <p className="text-base font-medium">{projectTitle || 'Título del Proyecto'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Fecha</h3>
                        <p className="text-base font-medium">{date}</p>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-left mb-12">
                    <thead>
                      <tr className="border-b-2 border-neutral-900">
                        <th className="py-3 font-semibold text-sm">Descripción</th>
                        <th className="py-3 font-semibold text-sm text-center">Tiempo</th>
                        <th className="py-3 font-semibold text-sm text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-neutral-100">
                          <td className="py-4 text-sm">{item.description || 'Item sin descripción'}</td>
                          <td className="py-4 text-sm text-center text-neutral-500">{item.time} {item.timeUnit}</td>
                          <td className="py-4 text-sm text-right font-medium">${(Number(item.price) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-16">
                    <div className="w-1/2">
                      <div className="flex justify-between py-2 text-sm border-b border-neutral-100">
                        <span className="text-neutral-500">Subtotal</span>
                        <span className="font-medium">${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-4 text-lg font-bold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>

                      <div className="mt-8 bg-neutral-50 p-4 rounded-xl text-xs text-neutral-500">
                        <h4 className="font-semibold text-neutral-700 mb-2">Desglose de tiempo</h4>
                        <ul className="mb-2 space-y-1">
                          {items.map(item => (
                            <li key={item.id}>
                              <span className="font-medium text-neutral-600">{item.description || 'Item sin descripción'}:</span> {item.time} {item.timeUnit}
                            </li>
                          ))}
                        </ul>
                        <h4 className="font-semibold text-neutral-700 mt-3 mb-1 border-t border-neutral-200 pt-2">Total acumulado</h4>
                        {totalTimeHoras > 0 && <p>• {totalTimeHoras} horas</p>}
                        {totalTimeDias > 0 && <p>• {totalTimeDias} días</p>}
                        {totalTimeSemanas > 0 && <p>• {totalTimeSemanas} semanas</p>}
                        {totalTimeMeses > 0 && <p>• {totalTimeMeses} meses</p>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-16 border-t border-neutral-200">
                    <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-neutral-700">Términos y Condiciones</h4>
                    <div className="text-xs text-neutral-500 leading-relaxed space-y-2">
                      <p>I. El presente presupuesto tiene una validez de quince (15) días calendario a partir de la fecha de emisión.</p>
                      <p>II. Para dar inicio formal al proyecto, se requiere un anticipo de <span className="font-semibold text-neutral-700">$100.00 USD</span>. El saldo restante será exigible al momento de la entrega final del proyecto, una vez verificada la conformidad con los requerimientos acordados.</p>
                      <p>III. Cualquier modificación al alcance original del proyecto podrá generar ajustes en el presupuesto y los plazos de entrega, los cuales serán notificados y acordados previamente por ambas partes.</p>
                      <p>IV. Todos los derechos sobre el producto final serán transferidos al cliente una vez completado el pago total.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
