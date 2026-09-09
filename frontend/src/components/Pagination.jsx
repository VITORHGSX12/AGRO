import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions = [10, 20, 50]
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(totalItems, currentPage * itemsPerPage);

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 select-none">
            {/* Itens per page & count */}
            <div className="flex items-center gap-3">
                <span>
                    Mostrando <strong className="text-white">{startItem}</strong> a <strong className="text-white">{endItem}</strong> de <strong className="text-white">{totalItems}</strong> registros
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span>Por página:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Primeira Página"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Página Anterior"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-semibold text-xs">
                    Página {currentPage} de {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Próxima Página"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Última Página"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
