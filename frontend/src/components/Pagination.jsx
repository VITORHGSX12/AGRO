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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border-t border-[#E6EBE8] text-xs text-[#64748B] select-none">
            {/* Itens per page & count */}
            <div className="flex items-center gap-3">
                <span>
                    Mostrando <strong className="text-[#172033] font-semibold">{startItem}</strong> a <strong className="text-[#172033] font-semibold">{endItem}</strong> de <strong className="text-[#172033] font-semibold">{totalItems}</strong> registros
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span>Por página:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="bg-[#F7F9F8] border border-[#E6EBE8] rounded-lg px-2 py-1 text-[#172033] text-xs focus:outline-none focus:border-[#087F5B]"
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
                    className="p-1.5 rounded-lg border border-[#E6EBE8] bg-[#F7F9F8] text-[#64748B] hover:text-[#172033] hover:bg-[#E8F5EF] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Primeira Página"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[#E6EBE8] bg-[#F7F9F8] text-[#64748B] hover:text-[#172033] hover:bg-[#E8F5EF] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Página Anterior"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 bg-[#F7F9F8] border border-[#E6EBE8] rounded-lg text-[#172033] font-semibold text-xs">
                    Página {currentPage} de {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[#E6EBE8] bg-[#F7F9F8] text-[#64748B] hover:text-[#172033] hover:bg-[#E8F5EF] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Próxima Página"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[#E6EBE8] bg-[#F7F9F8] text-[#64748B] hover:text-[#172033] hover:bg-[#E8F5EF] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Última Página"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
