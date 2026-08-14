import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminProductAttributesLinkerV2() {
  return (
    <div className="admin-visual-system container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Vincular Atributos ao Produto</CardTitle>
          <CardDescription>Gerencie atributos e precificação por produto</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Esta página permite vincular atributos aos produtos e definir sua precificação individual.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Funcionalidades</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Selecionar um produto</li>
              <li>Vincular atributos disponíveis</li>
              <li>Definir preço adicional por atributo</li>
              <li>Editar ou remover vínculos</li>
            </ul>
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Em Desenvolvimento</h3>
            <p className="text-amber-800">
              Esta página está em desenvolvimento. Enquanto isso, você pode:
            </p>
            <ul className="list-disc list-inside text-amber-800 space-y-1 mt-2">
              <li>Criar atributos em <strong>/admin/atributos</strong></li>
              <li>Gerenciar produtos em <strong>/admin/produtos</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
