'use client';

import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Importamos la interfaz del endpoint que ya tiene la estructura corregida
import type { UserReportData } from '@/app/api/user/report/route';

interface jsPDFWithPlugin extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export const ReportDownloadButton = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const generatePDFReport = (data: UserReportData) => {
        const doc = new jsPDF() as jsPDFWithPlugin;
        let y = 20;

        doc.setFontSize(22);
        doc.text('Reporte de Trayectoria - EcoMetrics', 105, y, { align: 'center' });
        y += 15;

        // ... (Sección 1: Datos Generales - sin cambios)
        doc.setFontSize(16); doc.text('1. Datos Generales', 14, y); y += 8;
        doc.setFontSize(12);
        doc.text(`Nombre: ${data.user.name}`, 14, y); doc.text(`Nivel Actual: ${data.user.level}`, 105, y); y += 7;
        doc.text(`Correo: ${data.user.email}`, 14, y); doc.text(`Puntos Totales: ${data.user.totalPoints}`, 105, y); y += 7;
        doc.text(`Miembro Desde: ${data.user.memberSince}`, 14, y); doc.text(`Tipo de Cuenta: ${data.user.accountType}`, 105, y); y += 15;

        // ... (Sección 2: Actividades - sin cambios)
        doc.setFontSize(16); doc.text('2. Actividades Registradas', 14, y); y += 8;
        autoTable(doc, {
            startY: y, head: [['Fecha', 'Título', 'Tipo', 'Cantidad', 'Puntos', 'Estado']],
            body: data.activities.map(act => [new Date(act.date).toLocaleDateString('es-MX'), act.title, act.type, `${act.quantity} ${act.unit}`, act.points, act.status === 'PENDING_REVIEW' ? 'Pendiente' : 'Revisada']),
            theme: 'grid', headStyles: { fillColor: [22, 163, 74] },
        });
        y = doc.lastAutoTable.finalY + 15;

        if (y > doc.internal.pageSize.height - 40) { doc.addPage(); y = 20; }

        // --- SECCIÓN DE IMPACTO AMBIENTAL CORREGIDA ---
        // La lógica de acceso a los datos no cambia, pero ahora será validada correctamente por TypeScript
        doc.setFontSize(16);
        doc.text('3. Impacto Ambiental Acumulado', 14, y);
        y += 8;
        autoTable(doc, {
            startY: y,
            head: [['Métrica de Impacto', 'Valor Ahorrado']],
            body: [
                ['Dióxido de Carbono (CO₂)', `${data.environmentalImpact.impact.co2Saved.toFixed(2)} kg`],
                ['Agua', `${data.environmentalImpact.impact.waterSaved.toFixed(2)} litros`],
                ['Energía', `${data.environmentalImpact.impact.energySaved.toFixed(2)} kWh`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
        });
        y = doc.lastAutoTable.finalY + 10;

        if (data.environmentalImpact.materialsRecycled.length > 0) {
            doc.setFontSize(12);
            doc.text('Desglose de Actividades de Impacto:', 14, y);
            y += 7;
            autoTable(doc, {
                startY: y,
                head: [['Actividad de Impacto', 'Cantidad Total']],
                body: data.environmentalImpact.materialsRecycled.map(material => [
                    material.name,
                    `${material.quantity.toFixed(2)} ${material.unit}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [75, 85, 99] },
            });
            y = doc.lastAutoTable.finalY + 15;
        }

        if (y > doc.internal.pageSize.height - 40) { doc.addPage(); y = 20; }

        // ... (Sección 4: Recompensas y Sección 5: Insignias - sin cambios)
        doc.setFontSize(16); doc.text('4. Recompensas Canjeadas', 14, y); y += 8;
        autoTable(doc, {
            startY: y, head: [['Fecha de Canje', 'Recompensa', 'Costo en Puntos']],
            body: data.redeemedRewards.map(redemption => [new Date(redemption.redeemedAt).toLocaleDateString('es-MX'), redemption.reward.title, redemption.reward.pointsCost]),
            theme: 'grid', headStyles: { fillColor: [22, 163, 74] },
        });
        y = doc.lastAutoTable.finalY + 15;
        if (y > doc.internal.pageSize.height - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(16); doc.text('5. Insignias Obtenidas', 14, y); y += 8;
        autoTable(doc, {
            startY: y, head: [['Insignia', 'Descripción']],
            body: data.obtainedBadges.map(badge => [badge.name, badge.description]),
            theme: 'grid', headStyles: { fillColor: [22, 163, 74] },
        });

        doc.save(`reporte_ecometrics_${data.user.name?.replace(/\s/g, '_') || 'usuario'}.pdf`);
    };

    const handleDownloadReport = async () => {
        setIsGenerating(true);
        try {
            toast({ title: "Generando reporte...", description: "Estamos recopilando tu información. Esto puede tardar un momento." });
            const response = await axios.get<UserReportData>('/api/user/report');
            generatePDFReport(response.data);
            toast({ title: "¡Reporte generado!", description: "Tu descarga comenzará en breve." });
        } catch (error) {
            console.error('Error al descargar el reporte', error);
            toast({ title: "Error", description: "Hubo un problema al generar tu reporte. Por favor, inténtalo de nuevo.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button onClick={handleDownloadReport} disabled={isGenerating}>
            {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando Reporte...</>) : (<><Download className="mr-2 h-4 w-4" />Descargar Reporte de Trayectoria</>)}
        </Button>
    );
};