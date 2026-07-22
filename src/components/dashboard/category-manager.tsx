"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/actions/category";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createCategorySchema, type CreateCategoryInput } from "@/schemas";
import type { Category } from "@/types";
import { useRouter } from "next/navigation";

type CategoryManagerProps = {
  categories: Category[];
};

const emptyValues: CreateCategoryInput = {
  name: "",
  description: "",
  image: "",
  active: true,
  sortOrder: 0,
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        description: editingCategory.description ?? "",
        image: editingCategory.image ?? "",
        active: editingCategory.active,
        sortOrder: editingCategory.sortOrder,
      });
      return;
    }

    form.reset(emptyValues);
  }, [editingCategory, form]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = editingCategory
        ? await updateCategoryAction({ ...values, id: editingCategory.id })
        : await createCategoryAction(values);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setEditingCategory(null);
      setMessage(editingCategory ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Deseja excluir esta categoria? Os produtos relacionados serão removidos.")) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    void (async () => {
      const result = await deleteCategoryAction({ id });
      if (!result.ok) {
        setMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      if (editingCategory?.id === id) {
        setEditingCategory(null);
      }

      setMessage("Categoria removida com sucesso.");
      router.refresh();
      setIsSubmitting(false);
    })();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>{editingCategory ? "Editar categoria" : "Nova categoria"}</CardTitle>
          <CardDescription>
            Estruture o menu com organização, ordem e imagem preparada para upload futuro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Nome
              </label>
              <Input id="category-name" {...form.register("name")} placeholder="Entradas" />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="category-description" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea
                id="category-description"
                {...form.register("description")}
                placeholder="Descreva o propósito da categoria."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category-image" className="text-sm font-medium">
                Imagem da categoria
              </label>
              <Input id="category-image" {...form.register("image")} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Estrutura pronta para upload, usando URL por enquanto.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="category-sort" className="text-sm font-medium">
                  Ordem
                </label>
                <Input id="category-sort" type="number" min={0} {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-input px-3 py-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("active")} />
                Categoria ativa
              </label>
            </div>
            {message ? <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                {editingCategory ? "Salvar alterações" : "Criar categoria"}
              </Button>
              {editingCategory ? (
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)} disabled={isSubmitting}>
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>{categories.length} categoria(s) cadastrada(s)</CardDescription>
            </div>
            <Badge variant="secondary">Multi-tenant</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma categoria encontrada neste restaurante.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <Badge variant={category.active ? "default" : "outline"}>
                        {category.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Slug: {category.slug}</p>
                    <p className="text-sm text-muted-foreground">{category.description || "Sem descrição"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                      <PencilLine className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className={cn("mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground")}>
                  <span>Ordem {category.sortOrder}</span>
                  <span>Criada em {formatDate(category.createdAt)}</span>
                  <span>Atualizada em {formatDate(category.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
