"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { createProductAction, deleteProductAction, updateProductAction } from "@/actions/product";
import { ConfirmationDialog } from "@/components/design-system/dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createProductSchema, type CreateProductInput } from "@/schemas";
import type { Category, Product } from "@/types";
import { useRouter } from "next/navigation";

type ProductManagerProps = {
  products: Product[];
  categories: Category[];
};

const emptyValues: CreateProductInput = {
  categoryId: "",
  name: "",
  description: "",
  image: "",
  price: 0,
  promotionalPrice: undefined,
  active: true,
  featured: false,
  preparationTime: undefined,
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProductManager({ products, categories }: ProductManagerProps) {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        categoryId: editingProduct.categoryId,
        name: editingProduct.name,
        description: editingProduct.description ?? "",
        image: editingProduct.image ?? "",
        price: editingProduct.price,
        promotionalPrice: editingProduct.promotionalPrice ?? undefined,
        active: editingProduct.active,
        featured: editingProduct.featured,
        preparationTime: editingProduct.preparationTime ?? undefined,
      });
      return;
    }

    form.reset(emptyValues);
  }, [editingProduct, form]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = editingProduct
        ? await updateProductAction({ ...values, id: editingProduct.id })
        : await createProductAction(values);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setEditingProduct(null);
      setMessage(editingProduct ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    void (async () => {
      const result = await deleteProductAction({ id: deleteTarget.id });
      if (!result.ok) {
        setMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      if (editingProduct?.id === deleteTarget.id) {
        setEditingProduct(null);
      }

      setMessage("Produto removido com sucesso.");
      setDeleteTarget(null);
      router.refresh();
      setIsSubmitting(false);
    })();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardHeader>
          <CardTitle>{editingProduct ? "Editar produto" : "Novo produto"}</CardTitle>
          <CardDescription>
            Cadastre itens do menu com preço, destaque e tempo de preparo estimado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label htmlFor="product-category" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="product-category"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
                {...form.register("categoryId")}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId ? (
                <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-sm font-medium">
                Nome
              </label>
              <Input id="product-name" {...form.register("name")} placeholder="Frango grelhado" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-description" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea id="product-description" {...form.register("description")} placeholder="Detalhes do item." disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-image" className="text-sm font-medium">
                Imagem do produto
              </label>
              <Input id="product-image" {...form.register("image")} placeholder="https://..." disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">Campo preparado para upload futuro de imagens.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="product-price" className="text-sm font-medium">
                  Preço
                </label>
                <Input id="product-price" type="number" min={0} step="1" {...form.register("price", { valueAsNumber: true })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <label htmlFor="product-promo" className="text-sm font-medium">
                  Promoção
                </label>
                <Input
                  id="product-promo"
                  type="number"
                  min={0}
                  step="1"
                  disabled={isSubmitting}
                  {...form.register("promotionalPrice", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="product-time" className="text-sm font-medium">
                  Tempo de preparo
                </label>
                <Input
                  id="product-time"
                  type="number"
                  min={1}
                  step="1"
                  disabled={isSubmitting}
                  {...form.register("preparationTime", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 rounded-xl border border-input px-3 py-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("active")} />
                  Ativo
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-input px-3 py-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("featured")} />
                  Em destaque
                </label>
              </div>
            </div>
            {message ? <p role="status" className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={isSubmitting}>
                <Plus className="h-4 w-4" />
                {editingProduct ? "Salvar alterações" : "Criar produto"}
              </Button>
              {editingProduct ? (
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)} disabled={isSubmitting}>
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>{products.length} produto(s) cadastrados</CardDescription>
            </div>
            <Badge variant="secondary">Menu profissional</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum produto encontrado neste restaurante.
            </div>
          ) : (
            products.map((product) => {
              const category = categoriesById.get(product.categoryId);
              return (
                <div key={product.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{product.name}</h3>
                        <Badge variant={product.featured ? "default" : "outline"}>
                          {product.featured ? "Destaque" : "Normal"}
                        </Badge>
                        <Badge variant={product.active ? "secondary" : "outline"}>
                          {product.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Slug: {product.slug}</p>
                      <p className="text-sm text-muted-foreground">{product.description || "Sem descrição"}</p>
                      <p className="text-sm font-medium">
                        {moneyFormatter.format(product.promotionalPrice ?? product.price)}
                        {product.promotionalPrice ? (
                          <span className="ml-2 text-xs text-muted-foreground line-through">
                            {moneyFormatter.format(product.price)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Categoria: {category?.name ?? "Categoria removida"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                        <PencilLine className="h-4 w-4" />
                        Editar
                      </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product)} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                  </div>
                  <div className={cn("mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground")}>
                    <span>Preparo {product.preparationTime ? `${product.preparationTime} min` : "não informado"}</span>
                    <span>Criado em {formatDate(product.createdAt)}</span>
                    <span>Atualizado em {formatDate(product.updatedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Excluir produto"
        description={
          deleteTarget
            ? `O produto "${deleteTarget.name}" será removido do catálogo. Se houver pedidos vinculados, o histórico permanece preservado.`
            : ""
        }
        confirmLabel="Excluir produto"
        cancelLabel="Manter produto"
        intent="destructive"
        loading={isSubmitting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
