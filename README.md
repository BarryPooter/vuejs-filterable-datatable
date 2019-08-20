## Introduction
The FilterableTable is meant to be the all-in-one datatable that we will be using anywhere.
Old tables will slowly be replaced by this table and this will cause us to have one point of maintenance for any given datatable!

## Details
The FilterableTable comes with the following features:
- You can configure which keys you want to display (and what the display name is).
- You can apply special filter conditions, i.e.:
Show only rows where Column A matches expected value 1.
- You can generate inputs and their based on the given table keys.
You may define the type of these inputs; text (default), number, date, etc..
- You can generate actions that should be at the end of the table by defining the route, icon and class.
- You can decide for an icon to be shown in a row when a certain condition is met, i.e.:
When the key 'expired' of row 12 matches value '1' show a specific icon.

## Props explained
This section will cover all expected and possible data you can pass to the FilterableTable.

### IdKey : String

This is the property which identifies which key is used for ids in the passed resources.
It is used primarily in the actions part of the FilterableTable, where an id is appended to appendable routes.

### Resources : Array

All the records/Objects from that you want to display in the database, keep it as light as possible ;-)

### TableKeys : Array

This defines which keys from the Resources array are being displayed in the table.
You may define the display_name for each key and wether the column should have a small width or not.

Structure (json):
```
[
    {
        key : String,
        display_name: String,
        small: Boolean(default: false)
    }
]
```

So as an example `{key: 'id', display_name:'Database ID', small: true}`

### Filterables (optional) : Array

This array contains special filters which apply to keys with a specific value.
So i.e.: When column A has value 1 display the records when the filter is turned on.

Structure (json):
```
[
    {
        key : String,
        filterValue : Mixed,
        display_name : String,
        refKey : String(default : NULL)
    }
]
```

The `key` field refers to the resource keys.

The `filterValue` is the expected value, so i.e.: 1.

The `display_name` is what to display on the filter button.

The `refKey` must be used when you want to use the same key twice.
So if you want to filter on a column with both the values 0 or 1, the `refKey` must be used in order to make it work properly, else it would overwrite the older key's data.
The `refKey` can be left out of records that you only use once.

### Searchables (optional) : Array

This defines for which keys a search input will be generated. Want a search input on the date or the modelnumber of a product? Ezpz.

Structure (json):
```
[
    {
        key : String,
        display_name : String,
        type : String(default : 'text')
    }
]
```

So the `key` property refers - again - to the key inside the resource rows.

The `display_name` property is the placeholder that will be displayed in the inputs.

The `type` property is an optional property with which you can defdine the type of the input.
By default a text input will be created, but if you want a date input or number it's easy to configure :-).

### ConditionalIcons (optional) : Array

The conditional icons is a cool addition with which you can define icons to be displayed when certain value conditions are met.
You want to display an icon whenever a resource meets the criteria active = 0? Easy, no problem.

Structure (json)
```
[
    {
        key : String,
        whenValue : Mixed,
        icon : String,
        class : String,
        title : String
    }
]
```

So the `key` property refers - again - to the key inside the resource rows.

The `whenValue` property defines which value must be met for the icon be applied.

The `icon` property decides the class of the icon inside the `.icon>i` element.

The `class` property decides which class will be applied to the `.icon` element.
Colour classes go perfectly here ;-)

The `title` property decides the `.icon[title]` attribute (mouse-over text).

### Actions (optional) : array

Here the action buttons will be defined. You want an edit link? Didn't I tell you already, EASY!

Structure (json):
```
[
    {
       route : String,
       icon : String,
       class : String,
       target : String,
       appendable : Boolean,
       replaceable: Boolean,
       title : String,
       confirm : Boolean|Null, // when true, a DELETE request is placed, instead of a GET.
       confirmMessage : String|Null,
       conditionals : Array [
            ['key' => String, 'value' => String|Number|Mixed]
       ]
    }
]
```

The `route` property is the route that will be placed around the icon, when using appendable routes, give id 0 as value, since 0 will become 0124 i.e. and work as 124.

when using replaceable routes, give id 0 as value, since 0 will become the idKey. This is meant for default resource routes which have routing like '/0/edit'.

The `icon` property is the class applied to the `.icon>i` element.

The `class` property is the class applied to the `.icon` element.

The `target` property is applied to the `a[target]` attribute of the wrapping anchor element.

The `appendable` property means the `idKey` of the FilterableTable component will be appended to the end of the given route. (Used for edit routes i.e.).

The `confirm` propery means there should be a confirm dialouge when the action is pressed.
The `confirmMessage` defines the message that will be displayed - this property can only be null if the `confirm` property is false or null.

The `title` property is applied to the `.icon[title]` attribute.

## Example
In the example I will show the PHP set-up, and how I parse it from the Blade file to the VueJS component.

The ViewModel which passes data to the blade (ProductViewModel@index).
```php
$tableKeys = [
    ['key' => 'product_id', 'display_name' => 'Database ID', 'small' => true],
    ['key' => 'modelnumber', 'display_name' => 'Modelnummer'],
    ['key' => 'categories', 'display_name' => 'Categorieën'],
    ['key' => 'updated_at', 'display_name' => 'Laatste wijziging'],
];
$filterables = [
    ['key' => 'expired', 'filterValue' => 1, 'display_name' => 'Oud Model'],
    ['key' => 'mandatory_energylabel', 'filterValue' => 1, 'display_name' => 'Met Energielabelverplichting'],
    ['key' => 'meets_energylabel_requirement', 'filterValue' => 1, 'display_name' => 'Heeft Energielabel', 'refKey' => 'meets_energylabel_requirement_on'],
    ['key' => 'meets_energylabel_requirement', 'filterValue' => 0, 'display_name' => 'Zonder Energielabel', 'refKey' => 'meets_energylabel_requirement_off'],
    ['key' => 'has_features', 'filterValue' => 1, 'display_name' => 'Met Kenmerken', 'refKey' => 'has_features_true'],
    ['key' => 'has_features', 'filterValue' => 0, 'display_name' => 'Zonder Kenmerken', 'refKey' => 'has_features_false'],
];
$searchables = [
    ['key' => 'product_id', 'display_name' => 'Database ID', 'type' => 'number'],
    ['key' => 'modelnumber', 'display_name' => 'Modelnummer'],
    ['key' => 'categories', 'display_name' => 'Categorieën'],
    ['key' => 'updated_at', 'display_name' => 'Laatst gewijzigd (YYYY-MM-DD)', 'type' => 'date'],
];
$conditionalIcons = [
    ['key' => 'has_features', 'whenValue' => 1, 'icon' => 'fa fa-th-list', 'class' => 'green-text', 'title' => "Dit product heeft kenmerken."],
    ['key' => 'has_features', 'whenValue' => 0, 'icon' => 'fa fa-th-list', 'class' => 'red-text', 'title' => "Dit product heeft geen kenmerken."],
    ['key' => 'meets_energylabel_requirement', 'whenValue' => 1, 'icon' => 'fa fa-tag', 'class' => 'green-text', 'title' => "Dit product heeft een energielabel."],
    ['key' => 'meets_energylabel_requirement', 'whenValue' => 0, 'icon' => 'fa fa-tag', 'class' => 'red-text', 'title' => "Dit product heeft geen energielabel."],
    ['key' => 'mandatory_energylabel', 'whenValue' => 1, 'icon' => 'fa fa-clipboard', 'class' => 'orange-text', 'title' => "Dit product heeft een energielabel-verplichting."],
    ['key' => 'expired', 'whenValue' => 1, 'icon' => 'fa fa-history', 'class' => 'blue-text', 'title' => "Dit is een oud model."],
];
return view('Modules.Products.table', [
    'tableKeys' => json_encode($tableKeys),
    'filterables' => json_encode($filterables),
    'searchables' => json_encode($searchables),
    'conditionalIcons' => json_encode($conditionalIcons),
    'actions' => json_encode($actions)
]);
```

The blade example (Modules.Products.table):
```blade
<filterable-table
    id-key="product_id"
    :resources="{{ $products }}"
    :table-keys="{{ $tableKeys }}"
    :filterables="{{ $filterables }}"
    :searchables="{{ $searchables }}"
    :conditional-icons="{{ $conditionalIcons }}"
    :actions="{{ $actions }}"
></filterable-table>
```
