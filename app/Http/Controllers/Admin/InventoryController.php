<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::query();

        if ($request->search) {
            $query->where('item_name', 'like', '%' . $request->search . '%');
        }

        if ($request->trashed === 'true') {
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/Inventory/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'trashed']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'min_stock' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        Inventory::create($validated);

        return back()->with('success', 'Item added to inventory.');
    }

    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'min_stock' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $inventory->update($validated);

        return back()->with('success', 'Inventory item updated.');
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();
        return back()->with('success', 'Item moved to trash.');
    }

    public function restore($id)
    {
        Inventory::withTrashed()->findOrFail($id)->restore();
        return back()->with('success', 'Item restored successfully.');
    }

    public function forceDelete($id)
    {
        Inventory::withTrashed()->findOrFail($id)->forceDelete();
        return back()->with('success', 'Item permanently deleted.');
    }
}
